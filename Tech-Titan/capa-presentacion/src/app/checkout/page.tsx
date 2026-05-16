"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, CreditCard, Lock,
  CheckCircle2, Loader2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { HardwareIcon } from "@/components/HardwareIcon";
import {
  usePCBuilderStore,
  selectSelectedProducts,
  selectTotalPrice,
} from "@/store/pc-builder";
import { cn } from "@/lib/utils";

type PayStep = "idle" | "processing" | "verifying" | "approved";

const STEP_META: Record<PayStep, { label: string; icon?: React.ReactNode; color: string }> = {
  idle:       { label: "Procesar Pago",   color: "text-gray-950" },
  processing: { label: "Procesando...",   icon: <Loader2 size={15} className="animate-spin" />, color: "text-cyan-300" },
  verifying:  { label: "Verificando...", icon: <Loader2 size={15} className="animate-spin" />, color: "text-amber-300" },
  approved:   { label: "¡Aprobado!",    icon: <CheckCircle2 size={15} />, color: "text-emerald-300" },
};

export default function CheckoutPage() {
  const router   = useRouter();
  const products = usePCBuilderStore(selectSelectedProducts);
  const total    = usePCBuilderStore(selectTotalPrice);

  const [step,      setStep]      = useState<PayStep>("idle");
  const [cardNum,   setCardNum]   = useState("");
  const [cardExp,   setCardExp]   = useState("");
  const [cardCvv,   setCardCvv]   = useState("");

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);

  const handlePay = useCallback(async () => {
    if (step !== "idle") return;
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1600));
    setStep("verifying");
    await new Promise((r) => setTimeout(r, 1300));
    setStep("approved");
    await new Promise((r) => setTimeout(r, 900));
    router.push("/checkout/success");
  }, [step, router]);

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
            <Lock size={11} /> Simulación segura · Stripe Mock
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order summary */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Resumen del Pedido
          </h2>

          <div className="glass-card overflow-hidden divide-y divide-gray-800/50">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg glass flex items-center justify-center flex-shrink-0">
                  <HardwareIcon category={p.category} size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono uppercase">{p.category}</p>
                </div>
                {p.price !== undefined && (
                  <span className="text-sm font-bold text-cyan-400 flex-shrink-0">
                    ${p.price.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-4 flex justify-between items-center">
            <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">Total</span>
            <span className="text-2xl font-black gradient-text-accent">
              ${total.toLocaleString()} USD
            </span>
          </div>
        </div>

        {/* Payment form */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Datos de Pago
          </h2>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-cyan-400" />
                <span className="text-xs text-gray-400 font-mono">TARJETA DE CRÉDITO</span>
              </div>
              <div className="flex gap-1.5 text-[10px] font-mono text-gray-600">
                {["VISA", "MC", "AMEX"].map((b) => (
                  <span key={b} className="border border-gray-700/60 rounded px-1.5 py-0.5">{b}</span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  Número de tarjeta
                </label>
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
                {[
                  { label: "Vencimiento", value: cardExp, setter: setCardExp, placeholder: "MM/AA", max: 5 },
                  { label: "CVV",         value: cardCvv, setter: setCardCvv, placeholder: "•••",   max: 3, type: "password" as const },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      {f.label}
                    </label>
                    <input
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      maxLength={f.max}
                      type={f.type}
                      disabled={isPaying}
                      className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pay button */}
          <motion.button
            onClick={handlePay}
            disabled={isPaying}
            animate={step === "approved" ? { scale: [1, 1.025, 1] } : {}}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base transition-all duration-500 flex items-center justify-center gap-2.5",
              step === "idle"
                ? "btn-neon"
                : step === "approved"
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-gray-800 text-gray-400 cursor-wait"
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
                {step === "idle" && ` — $${total.toLocaleString()} USD`}
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
