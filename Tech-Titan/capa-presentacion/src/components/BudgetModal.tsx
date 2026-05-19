"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X, ShoppingCart, XCircle, AlertTriangle,
  DollarSign, Zap, FileText, ShieldCheck, Download, Link,
} from "lucide-react";
import { HardwareIcon } from "./HardwareIcon";
import { cn } from "@/lib/utils";
import { exportBuildToPDF } from "@/lib/pdf-export";
import type { HardwareProduct, ValidationResult } from "@/types/hardware";
import { ComponentCategory } from "@/types/hardware";
import type { BuildStep } from "./StepIndicator";
import { useCurrencyStore, formatPrice } from "@/store/currency";

const STEP_CATEGORIES: Record<number, ComponentCategory> = {
  0: ComponentCategory.CPU,
  1: ComponentCategory.MOTHERBOARD,
  2: ComponentCategory.RAM,
};

interface BudgetModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  steps:       readonly BuildStep[];
  selected:    Partial<Record<ComponentCategory, HardwareProduct>>;
  totalPrice:  number;
  totalTdp:    number;
  validation:  ValidationResult | null;
  isValidating: boolean;
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.18 } },
};

// ─── Card animation ───────────────────────────────────────────────────────────

const card = {
  hidden:  { opacity: 0, scale: 0.92, y: 28 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22, delay: 0.05 } },
  exit:    { opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18 } },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function CompatibilityStatus({ validation, isValidating }: { validation: ValidationResult | null; isValidating: boolean }) {
  if (isValidating) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/40">
        <svg className="w-4 h-4 text-cyan-400 animate-spin-slow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-gray-400 font-mono">Verificando compatibilidad...</span>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
        <AlertTriangle size={14} className="text-amber-500" />
        <span className="text-xs text-amber-400/80 font-mono">Selecciona componentes para validar</span>
      </div>
    );
  }

  if (validation.compatible) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 animate-pulse-green"
      >
        <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-400">BUILD COMPATIBLE</p>
          {validation.warnings.length > 0 && (
            <p className="text-[10px] text-amber-400/80 font-mono mt-0.5">
              {validation.warnings.length} aviso(s) menor(es)
            </p>
          )}
        </div>
        <ShieldCheck size={14} className="text-emerald-400" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse-red">
        <XCircle size={16} className="text-red-400 flex-shrink-0" />
        <p className="text-xs font-semibold text-red-400">INCOMPATIBILIDAD DETECTADA</p>
      </div>
      {validation.errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 text-xs text-red-300">
          <span className="text-red-500 mt-0.5 flex-shrink-0">▸</span>
          {err}
        </div>
      ))}
    </motion.div>
  );
}

// ─── Component row ────────────────────────────────────────────────────────────

function ComponentRow({ product, index }: { product: HardwareProduct; index: number }) {
  const currencyStore = useCurrencyStore();
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.25 }}
      className="flex items-center gap-3 py-2.5 border-b border-gray-800/50 last:border-0"
    >
      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0">
        <HardwareIcon category={product.category} size={15} className="text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{product.name}</p>
        <p className="text-[10px] text-gray-500 font-mono uppercase">{product.category}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        {product.price_usd !== undefined ? (
          <p className="text-sm font-bold text-cyan-400">{formatPrice(currencyStore, product.price_usd)}</p>
        ) : (
          <p className="text-xs text-gray-600 font-mono">—</p>
        )}
        {product.metadata.tdp_watts && (
          <p className="text-[10px] text-amber-600 font-mono">{product.metadata.tdp_watts}W</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── BudgetModal ──────────────────────────────────────────────────────────────

export function BudgetModal({
  isOpen, onClose, steps, selected, totalPrice, totalTdp, validation, isValidating,
}: BudgetModalProps) {
  const router        = useRouter();
  const currencyStore = useCurrencyStore();
  const [exporting, setExporting] = useState(false);

  const components = steps
    .map((s) => selected[STEP_CATEGORIES[s.index]!])
    .filter((p): p is HardwareProduct => p !== undefined);

  const recommendedPsu = totalTdp > 0
    ? `${Math.ceil((totalTdp * 1.35) / 50) * 50}W`
    : null;

  // URL de compartir con IDs de los productos seleccionados
  function getBuildUrl(): string {
    const ids = components.map((p) => p.id).join(",");
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/pc-builder?build=${ids}`;
  }

  async function handleExportPDF() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBuildToPDF({
        products:   components,
        totalPrice,
        totalTdp,
        validation,
        buildUrl:   getBuildUrl(),
      });
      toast.success("PDF generado", { description: "La descarga ha comenzado." });
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setExporting(false);
    }
  }

  function handleCopyLink() {
    const url = getBuildUrl();
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copiado", { description: "Comparte la URL para recuperar este build." });
    });
  }

  function handleCheckout() {
    onClose();
    router.push("/checkout");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              variants={card}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto w-full max-w-md"
            >
              <div className="glass rounded-2xl border border-cyan-500/20 shadow-neon-md overflow-hidden">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                      <FileText size={15} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-wide">Presupuesto Final</h2>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {components.length} componente{components.length !== 1 ? "s" : ""} seleccionado{components.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800/60"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

                  {/* ── Compatibility status ──────────────────────────── */}
                  <CompatibilityStatus validation={validation} isValidating={isValidating} />

                  {/* ── Component list ────────────────────────────────── */}
                  {components.length > 0 && (
                    <div className="glass-card px-4 py-1">
                      {components.map((product, i) => (
                        <ComponentRow key={product.id} product={product} index={i} />
                      ))}
                    </div>
                  )}

                  {/* ── Totals ────────────────────────────────────────── */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Price */}
                    <div className="glass-card p-3 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase">
                        <DollarSign size={10} /> Total
                      </div>
                      {totalPrice > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, type: "spring" as const }}
                        >
                          <p className="text-xl font-black gradient-text-accent">
                            {formatPrice(currencyStore, totalPrice)}
                          </p>
                          {currencyStore.selectedCurrency !== "USD" && (
                            <p className="text-[10px] font-mono text-gray-600">
                              ${totalPrice.toLocaleString()} USD
                            </p>
                          )}
                        </motion.div>
                      ) : (
                        <p className="text-sm text-gray-600 font-mono">Sin precios</p>
                      )}
                    </div>

                    {/* Power */}
                    <div className="glass-card p-3 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase">
                        <Zap size={10} /> Potencia
                      </div>
                      {totalTdp > 0 ? (
                        <div>
                          <p className="text-lg font-bold text-amber-400">{totalTdp}W</p>
                          {recommendedPsu && (
                            <p className="text-[10px] text-gray-600 font-mono">
                              PSU ≥ {recommendedPsu}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 font-mono">Sin TDP</p>
                      )}
                    </div>
                  </div>

                  {/* Warnings (si es compatible pero con avisos) */}
                  {validation?.compatible && validation.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {validation.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Footer actions ────────────────────────────────── */}
                <div className="px-5 py-4 border-t border-gray-800/60 space-y-2.5">
                  {/* Share row */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="btn-ghost flex-1 justify-center text-xs py-2"
                      title="Copiar URL para compartir"
                    >
                      <Link size={12} /> Copiar Link
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={exporting || components.length === 0}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all duration-200 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10",
                        exporting && "opacity-50 cursor-wait"
                      )}
                    >
                      <Download size={12} className={exporting ? "animate-bounce" : ""} />
                      {exporting ? "Generando..." : "Exportar PDF"}
                    </button>
                  </div>

                  {/* Primary actions row */}
                  <div className="flex gap-2">
                    <button onClick={onClose} className="btn-ghost flex-1 justify-center text-xs py-2.5">
                      Seguir armando
                    </button>
                    <button
                      onClick={handleCheckout}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all duration-200",
                        validation?.compatible === false
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
                          : "btn-neon"
                      )}
                      disabled={validation?.compatible === false}
                      title={validation?.compatible === false ? "Corrige las incompatibilidades primero" : ""}
                    >
                      <ShoppingCart size={14} />
                      Ir al Checkout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
