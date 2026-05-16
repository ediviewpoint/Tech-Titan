"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { HardwareIcon } from "./HardwareIcon";
import { ValidationBanner } from "./ValidationBanner";
import { cn } from "@/lib/utils";
import type { HardwareProduct, ValidationResult } from "@/types/hardware";
import { ComponentCategory } from "@/types/hardware";
import type { BuildStep } from "./StepIndicator";

const STEP_CATEGORIES: Record<number, ComponentCategory> = {
  0: ComponentCategory.CPU,
  1: ComponentCategory.MOTHERBOARD,
  2: ComponentCategory.RAM,
};

// Margen de seguridad estándar de la industria (20%) + overhead de sistema
const PSU_SAFETY_MARGIN = 1.35;

interface BuildManifestProps {
  steps:           readonly BuildStep[];
  selected:        Partial<Record<ComponentCategory, HardwareProduct>>;
  totalPrice:      number;
  totalTdp:        number;
  onRemove:        (category: ComponentCategory) => void;
  validation:      ValidationResult | null;
  isValidating:    boolean;
  validationError: Error | null;
}

// ─── SlotRow ─────────────────────────────────────────────────────────────────

function SlotRow({
  step, product, onRemove,
}: {
  step: BuildStep; product: HardwareProduct | undefined; onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300",
        product ? "border-cyan-500/25 bg-cyan-500/5" : "border-gray-700/40 bg-gray-800/30"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-500",
        product ? "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "bg-gray-600"
      )} />

      <div className={cn(
        "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
        product ? "text-cyan-400" : "text-gray-600"
      )}>
        <HardwareIcon category={STEP_CATEGORIES[step.index]!} size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{step.label}</p>
        <AnimatePresence mode="wait">
          {product ? (
            <motion.p
              key="name"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-white font-medium truncate"
            >
              {product.name}
            </motion.p>
          ) : (
            <motion.p key="pending" className="text-xs text-gray-600 italic">Pendiente...</motion.p>
          )}
        </AnimatePresence>
      </div>

      {product ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {product.price !== undefined && (
            <span className="text-[10px] font-mono text-cyan-500">${product.price}</span>
          )}
          <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors p-0.5" title="Quitar">
            <X size={12} />
          </button>
        </div>
      ) : (
        <Clock size={12} className="text-gray-700 flex-shrink-0" />
      )}
    </motion.div>
  );
}

// ─── PowerBar ────────────────────────────────────────────────────────────────

function PowerBar({ totalTdp, selected }: { totalTdp: number; selected: Partial<Record<ComponentCategory, HardwareProduct>> }) {
  const psu            = selected[ComponentCategory.PSU];
  const psuWattage     = psu?.metadata.wattage_watts;
  const recommendedPsu = Math.ceil((totalTdp * PSU_SAFETY_MARGIN) / 50) * 50; // redondear a 50W

  // Con PSU seleccionada: mostrar % de carga real
  if (psuWattage) {
    const loadPct   = Math.min((totalTdp / psuWattage) * 100, 100);
    const isHigh    = loadPct > 80;
    const isMedium  = loadPct > 60;
    const barColor  = isHigh   ? "from-red-500 to-orange-500"
                    : isMedium ? "from-amber-500 to-yellow-500"
                    :            "from-emerald-500 to-teal-400";
    const textColor = isHigh ? "text-red-400" : isMedium ? "text-amber-400" : "text-emerald-400";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-500 flex items-center gap-1"><Zap size={10} /> CARGA PSU</span>
          <span className={textColor}>{Math.round(loadPct)}% · {totalTdp}W / {psuWattage}W</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${loadPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {isHigh && (
          <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
            <AlertTriangle size={10} /> PSU al límite — considera una de mayor capacidad
          </p>
        )}
        {!isHigh && (
          <p className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-600" /> {psu.name.split(" ").slice(0, 3).join(" ")}
          </p>
        )}
      </div>
    );
  }

  // Sin PSU: mostrar TDP estimado vs recomendado
  if (totalTdp === 0) return null;

  const fillPct   = Math.min((totalTdp / 500) * 100, 100);
  const barColor  = totalTdp > 300 ? "from-red-500 to-orange-500"
                  : totalTdp > 150 ? "from-amber-500 to-yellow-500"
                  :                  "from-cyan-500 to-blue-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-gray-500 flex items-center gap-1"><Zap size={10} /> TDP ESTIMADO</span>
        <span className="text-amber-400">{totalTdp}W (solo CPU)</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-gray-600 font-mono">
        PSU recomendada ≥ <span className="text-cyan-700">{recommendedPsu}W 80+ Gold</span>
        <span className="text-gray-700"> (con GPU discreta)</span>
      </p>
    </div>
  );
}

// ─── BuildManifest ────────────────────────────────────────────────────────────

export function BuildManifest({
  steps, selected, totalPrice, totalTdp, onRemove,
  validation, isValidating, validationError,
}: BuildManifestProps) {
  const completedCount = steps.filter((s) => selected[STEP_CATEGORIES[s.index]!] !== undefined).length;
  const progress       = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-3">
      {/* ── Manifest card ─────────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Build Manifest</h2>
          <span className="text-xs font-mono text-cyan-500">{completedCount}/{steps.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: progress === 100
                ? "linear-gradient(90deg, #10b981, #34d399)"
                : "linear-gradient(90deg, #06b6d4, #3b82f6)",
            }}
          />
        </div>

        {/* Slots */}
        <div className="space-y-2">
          {steps.map((step) => {
            const cat = STEP_CATEGORIES[step.index]!;
            return (
              <SlotRow
                key={step.index}
                step={step}
                product={selected[cat]}
                onRemove={() => onRemove(cat)}
              />
            );
          })}
        </div>

        {/* ── Metrics ───────────────────────────────────────────────── */}
        {(totalPrice > 0 || totalTdp > 0) && (
          <div className="pt-3 border-t border-gray-800 space-y-3">
            {/* Price */}
            {totalPrice > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase">
                  <DollarSign size={10} /> Precio parcial
                </div>
                <p className="text-sm font-bold gradient-text-accent">${totalPrice.toLocaleString()}</p>
              </div>
            )}

            {/* Power bar */}
            <PowerBar totalTdp={totalTdp} selected={selected} />
          </div>
        )}
      </div>

      {/* ── Validating spinner ────────────────────────────────────────── */}
      <AnimatePresence>
        {isValidating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <svg className="w-4 h-4 text-cyan-400 animate-spin-slow flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-gray-400 font-mono">Comprobando compatibilidad...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Validation error ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!isValidating && validationError && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card p-4 border-red-500/20 bg-red-500/5"
          >
            <p className="text-xs text-red-400 font-mono">⚠ {validationError.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Validation result ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!isValidating && !validationError && validation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <ValidationBanner result={validation} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── API trace ─────────────────────────────────────────────────── */}
      {!isValidating && validation && (
        <div className="px-1">
          <p className="text-[10px] font-mono text-gray-700 leading-relaxed">
            <span className="text-cyan-800">POST</span> /store/pc-builder/validate<br />
            <span className="text-gray-700">├ Zod middleware → CompatibilityService</span><br />
            <span className="text-gray-700">└ Winston → logs/error.log</span>
          </p>
        </div>
      )}
    </div>
  );
}
