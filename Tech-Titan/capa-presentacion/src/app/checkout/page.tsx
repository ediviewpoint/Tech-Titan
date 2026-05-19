"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowLeft, Package,
  MessageCircle, FileText, CheckCircle2, Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { HardwareIcon } from "@/components/HardwareIcon";
import {
  usePCBuilderStore,
  selectSelectedProducts,
  selectTotalPrice,
} from "@/store/pc-builder";
import { useCurrencyStore, formatPrice, getEffectiveRate } from "@/store/currency";
import { createOrder } from "@/lib/api";
import { exportBuildToPDF } from "@/lib/pdf-export";
import { resolveProductImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { HardwareProduct } from "@/types/hardware";

// ─── Configuración WhatsApp ───────────────────────────────────────────────────
// Configura tu número en .env: NEXT_PUBLIC_WHATSAPP_NUMBER=59170000000
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "59170000000";

const CATEGORY_EMOJI: Record<string, string> = {
  CPU:         "🔵",
  Motherboard: "🟣",
  RAM:         "🟢",
  GPU:         "🩷",
  PSU:         "⚡",
  Storage:     "💾",
  Case:        "📦",
  Cooler:      "❄️",
};

function buildWhatsAppText(
  products:       HardwareProduct[],
  totalFormatted: string,
  totalUsd:       number,
  currency:       string,
  compatible:     boolean | null,
  buildUrl:       string,
  notes:          string,
): string {
  const lines: string[] = [
    "¡Hola Tech-Titan! 👋",
    "",
    "Me interesa cotizar este build de PC:",
    "",
  ];

  for (const p of products) {
    const emoji = CATEGORY_EMOJI[p.category] ?? "🔧";
    lines.push(`${emoji} ${p.category}: ${p.name} — $${p.price_usd.toFixed(2)} USD`);
  }

  lines.push("");
  if (currency !== "USD") {
    lines.push(`💰 Total: ${totalFormatted} (= $${totalUsd.toFixed(2)} USD)`);
  } else {
    lines.push(`💰 Total: ${totalFormatted}`);
  }

  if (compatible === true)  lines.push("✅ Build 100% compatible");
  if (compatible === false) lines.push("⚠️ Build tiene incompatibilidades");

  lines.push(`🔗 Ver configuración: ${buildUrl}`);

  if (notes.trim()) {
    lines.push("");
    lines.push(`📝 Nota: ${notes.trim()}`);
  }

  lines.push("");
  lines.push("¿Tienen disponibilidad de todos los componentes? ¿Cuál es el plazo de entrega?");

  return lines.join("\n");
}

// ─── Product image helper ─────────────────────────────────────────────────────

function ProductImage({ svgKey, category }: { svgKey?: string; category: string }) {
  const src = resolveProductImage(svgKey);
  if (src) {
    return (
      <img
        src={src}
        alt={category}
        width={22}
        height={22}
        className="object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <HardwareIcon category={category} size={22} className="text-gray-400" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router        = useRouter();
  const products      = usePCBuilderStore(selectSelectedProducts);
  const totalUsd      = usePCBuilderStore(selectTotalPrice);
  const currencyStore = useCurrencyStore();

  const [email,      setEmail]      = useState("");
  const [notes,      setNotes]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [exporting,  setExporting]  = useState(false);

  const { selectedCurrency } = currencyStore;
  const effectiveRate  = getEffectiveRate(currencyStore);
  const totalLocal     = totalUsd * effectiveRate;
  const formattedTotal = formatPrice(currencyStore, totalUsd);

  function getBuildUrl() {
    const ids  = products.map((p) => p.id).join(",");
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/pc-builder?build=${ids}`;
  }

  const handleWhatsApp = useCallback(async () => {
    if (sending) return;
    setSending(true);
    try {
      // Registrar la orden en la DB para tracking interno
      const order = await createOrder({
        user_email:    email.trim() || undefined,
        currency:      selectedCurrency,
        total_usd:     totalUsd,
        total_local:   selectedCurrency !== "USD" ? totalLocal : undefined,
        exchange_rate: selectedCurrency !== "USD" ? effectiveRate : undefined,
        notes:         notes.trim() || undefined,
        items: products.map((p) => ({
          product_id: p.id,
          name:       p.name,
          category:   p.category,
          price_usd:  p.price_usd,
          quantity:   1,
          svg_key:    p.svg_key,
          metadata:   p.metadata,
        })),
      }).catch(() => null); // no bloquear si el backend falla

      const text    = buildWhatsAppText(
        products, formattedTotal, totalUsd,
        selectedCurrency, null, getBuildUrl(), notes
      );
      const waUrl   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      router.push(`/checkout/success${order?.id ? `?order=${order.id}` : "?via=whatsapp"}`);
    } catch {
      toast.error("Error al procesar. Intentá de nuevo.");
      setSending(false);
    }
  }, [sending, email, notes, products, totalUsd, totalLocal, effectiveRate, selectedCurrency, router, formattedTotal]);

  const handleExportPDF = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { symbols, showWithTax, taxRate, apiRates } = currencyStore;
      const rate       = apiRates[selectedCurrency] ?? 1;
      const tax        = showWithTax ? 1 + taxRate / 100 : 1;
      await exportBuildToPDF({
        products,
        totalPrice:     totalUsd,
        totalTdp:       products.reduce((s, p) => s + (p.metadata.tdp_watts ?? 0), 0),
        validation:     null,
        buildUrl:       getBuildUrl(),
        currency:       selectedCurrency,
        totalLocal:     totalUsd * rate * tax,
        currencySymbol: symbols[selectedCurrency] ?? "$",
        showWithTax,
        taxRate,
      });
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setExporting(false);
    }
  }, [exporting, products, totalUsd, currencyStore, selectedCurrency]);

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

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/pc-builder" className="btn-ghost py-1.5 text-xs">
          <ArrowLeft size={13} /> Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold neon-text">Solicitar Cotización</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Package size={11} /> {products.length} componente(s) · {selectedCurrency}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Resumen de componentes ──────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Resumen del Build
          </h2>

          <div className="glass-card overflow-hidden divide-y divide-gray-800/50">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-lg glass flex items-center justify-center flex-shrink-0 p-1">
                  <ProductImage svgKey={p.svg_key} category={p.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono uppercase">{p.category}</p>
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
              <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">Total estimado</span>
              <span className="text-2xl font-black gradient-text-accent">{formattedTotal}</span>
            </div>
            {selectedCurrency !== "USD" && (
              <div className="flex justify-between text-[11px] text-gray-600 font-mono">
                <span>En USD</span>
                <span>${totalUsd.toLocaleString()} USD</span>
              </div>
            )}
            <p className="text-[10px] text-gray-600 font-mono pt-1 border-t border-gray-800/40">
              * Precio final sujeto a disponibilidad de stock
            </p>
          </div>
        </div>

        {/* ── Contacto y envío ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Datos de contacto
          </h2>

          <div className="glass-card p-5 space-y-4">

            {/* Email */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">
                Email (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={sending}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">
                Comentarios / Consultas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: ¿Tienen garantía? ¿Hacen envíos a Cochabamba?..."
                rows={3}
                maxLength={300}
                disabled={sending}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Info de proceso */}
            <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-cyan-400">¿Cómo funciona?</p>
              <ol className="space-y-1 text-[10px] text-gray-500 list-decimal list-inside">
                <li>Hacés clic en "Solicitar por WhatsApp"</li>
                <li>Se abre WhatsApp con tu build pre-cargado</li>
                <li>Confirmamos disponibilidad y coordinamos el pago</li>
              </ol>
            </div>
          </div>

          {/* CTA principal — WhatsApp */}
          <motion.button
            onClick={handleWhatsApp}
            disabled={sending}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200",
              sending
                ? "bg-gray-800 text-gray-500 cursor-wait"
                : "text-white"
            )}
            style={!sending ? {
              background:  "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              boxShadow:   "0 0 24px rgba(37,211,102,0.4), 0 0 60px rgba(37,211,102,0.15)",
            } : undefined}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={sending ? "sending" : "idle"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5"
              >
                {sending
                  ? <><Loader2 size={18} className="animate-spin" /> Abriendo WhatsApp...</>
                  : <><MessageCircle size={18} /> Solicitar por WhatsApp</>
                }
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* CTA secundario — PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-200",
              exporting
                ? "opacity-50 cursor-wait border-gray-700 text-gray-500"
                : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/8"
            )}
          >
            <FileText size={15} className={exporting ? "animate-pulse" : ""} />
            {exporting ? "Generando PDF..." : "Descargar cotización PDF"}
          </button>

          <p className="text-center text-[10px] text-gray-700 font-mono">
            Tu configuración se guarda automáticamente al solicitar
          </p>
        </div>
      </div>
    </main>
  );
}
