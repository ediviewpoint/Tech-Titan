"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, CreditCard, Lock,
  CheckCircle2, Loader2, ArrowLeft, Package,
} from "lucide-react";
import Link from "next/link";
import { HardwareIcon } from "@/components/HardwareIcon";
import {
  usePCBuilderStore,
  selectSelectedProducts,
  selectTotalPrice,
} from "@/store/pc-builder";
import { useCurrencyStore, formatPrice, getEffectiveRate } from "@/store/currency";
import { createOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayStep = "idle" | "processing" | "verifying" | "approved";

const STEP_META: Record<PayStep, { label: string; icon?: React.ReactNode; color: string }> = {
  idle:       { label: "Confirmar Pedido",  color: "text-gray-950" },
  processing: { label: "Procesando...",     icon: <Loader2 size={15} className="animate-spin" />, color: "text-cyan-300" },
  verifying:  { label: "Verificando...",    icon: <Loader2 size={15} className="animate-spin" />, color: "text-amber-300" },
  approved:   { label: "¡Confirmado!",      icon: <CheckCircle2 size={15} />,                     color: "text-emerald-300" },
};

// ─── Product image helper ─────────────────────────────────────────────────────

function ProductImage({ svgKey, category, size = 16 }: { svgKey?: string; category: string; size?: number }) {
  if (svgKey) {
    return (
      <img
        src={`/hardware/${svgKey}.svg`}
        alt={category}
        width={size}
        height={size}
        className="object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <HardwareIcon category={category} size={size} className="text-gray-400" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router        = useRouter();
  const products      = usePCBuilderStore(selectSelectedProducts);
  const totalUsd      = usePCBuilderStore(selectTotalPrice);
  const currencyStore = useCurrencyStore();

  const [step,    setStep]    = useState<PayStep>("idle");
  const [email,   setEmail]   = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [error,   setError]   = useState<string | null>(null);

  const { selectedCurrency } = currencyStore;
  const effectiveRate = getEffectiveRate(currencyStore);
  const totalLocal    = totalUsd * effectiveRate;
  const formattedTotal = formatPrice(currencyStore, totalUsd);

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);

  const handlePay = useCallback(async () => {
    if (step !== "idle") return;
    setError(null);
    setStep("processing");

    try {
      await new Promise((r) => setTimeout(r, 1400));
      setStep("verifying");
      await new Promise((r) => setTimeout(r, 1100));

      const order = await createOrder({
        user_email:    email || undefined,
        currency:      selectedCurrency,
        total_usd:     totalUsd,
        total_local:   selectedCurrency !== "USD" ? totalLocal : undefined,
        exchange_rate: selectedCurrency !== "USD" ? effectiveRate : undefined,
        items: products.map((p) => ({
          product_id: p.id,
          name:       p.name,
          category:   p.category,
          price_usd:  p.price_usd,
          quantity:   1,
          svg_key:    p.svg_key,
          metadata:   p.metadata,
        })),
      });

      setStep("approved");
      await new Promise((r) => setTimeout(r, 700));
      router.push(`/checkout/success?order=${order.id}`);
    } catch (err) {
      // Fallback: si el backend no está disponible igual avanza (demo mode)
      setStep("approved");
      await new Promise((r) => setTimeout(r, 700));
      router.push("/checkout/success");
    }
  }, [step, router, email, selectedCurrency, totalUsd, totalLocal, effectiveRate, products]);

  if (products.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <ShoppingCart size={48} className="text-gray-600 mx-auto" />
        <h1 className="text-xl font-semibold text-gray-400">Tu carrito está vacío</h1>
        <Link href="/pc-builder" className="btn-neon inline-flex">
          Ir al PC Builder
        </Link>
      </main>
    );
  }

  const isPaying = step !== "idle";
  const { icon, label, color } = STEP_META[step];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/pc-builder" className="btn-ghost py-1.5 text-xs">
          <ArrowLeft size={13} /> Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold neon-text">Checkout</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Lock size={11} /> {products.length} componente(s) · {selectedCurrency}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Order summary ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Resumen del Pedido
          </h2>

          <div className="glass-card overflow-hidden divide-y divide-gray-800/50">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-lg glass flex items-center justify-center flex-shrink-0 p-1">
                  <ProductImage svgKey={p.svg_key} category={p.category} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono uppercase">{p.category}</p>
                  {p.description && (
                    <p className="text-[10px] text-gray-600 mt-0.5 truncate">{p.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-cyan-400">
                    {formatPrice(currencyStore, p.price_usd)}
                  </p>
                  {selectedCurrency !== "USD" && (
                    <p className="text-[10px] text-gray-600 font-mono">
                      ${p.price_usd.toLocaleString()} USD
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="glass-card p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black gradient-text-accent">{formattedTotal}</span>
            </div>
            {selectedCurrency !== "USD" && (
              <div className="flex justify-between items-center text-[11px] text-gray-600 font-mono">
                <span>En USD</span>
                <span>${totalUsd.toLocaleString()} USD</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px] text-gray-600 font-mono">
              <span>Tipo de cambio</span>
              <span>1 USD = {effectiveRate.toFixed(2)} {selectedCurrency}</span>
            </div>
          </div>
        </div>

        {/* ── Payment form ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Datos del Pedido
          </h2>

          <div className="glass-card p-5 space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={10} /> Email (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={isPaying}
                className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="border-t border-gray-800/60 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={15} className="text-cyan-400" />
                  <span className="text-xs text-gray-400 font-mono">TARJETA</span>
                </div>
                <div className="flex gap-1.5 text-[10px] font-mono text-gray-600">
                  {["VISA", "MC", "AMEX"].map((b) => (
                    <span key={b} className="border border-gray-700/60 rounded px-1.5 py-0.5">{b}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Número</label>
                  <input
                    value={cardNum}
                    onChange={(e) => setCardNum(formatCard(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    disabled={isPaying}
                    className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono tracking-widest transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Vence</label>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                      disabled={isPaying}
                      className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">CVV</label>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={3}
                      type="password"
                      disabled={isPaying}
                      className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-mono px-1">{error}</p>
          )}

          {/* Pay button */}
          <motion.button
            onClick={handlePay}
            disabled={isPaying}
            animate={step === "approved" ? { scale: [1, 1.025, 1] } : {}}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base transition-all duration-500 flex items-center justify-center gap-2.5",
              step === "idle"     ? "btn-neon"                                   :
              step === "approved" ? "bg-emerald-500 text-white cursor-default"   :
                                    "bg-gray-800 text-gray-400 cursor-wait"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                className={cn("flex items-center gap-2", color)}
              >
                {icon ?? <Lock size={15} />}
                {label}
                {step === "idle" && ` — ${formattedTotal}`}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <p className="text-center text-[10px] text-gray-700 font-mono">
            🔒 Simulación para demo · No se procesa ningún cargo real
          </p>
        </div>
      </div>
    </main>
  );
}
