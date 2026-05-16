"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/types/hardware";

interface ValidationBannerProps {
  result: ValidationResult;
}

export function ValidationBanner({ result }: ValidationBannerProps) {
  const controls    = useAnimationControls();
  const prevErrors  = useRef(result.errors.length);

  // Dispara shake solo cuando aparecen nuevos errores
  useEffect(() => {
    if (!result.compatible && result.errors.length > 0 && result.errors.length !== prevErrors.current) {
      controls.start({
        x: [0, -10, 9, -7, 6, -4, 3, 0],
        transition: { duration: 0.55, ease: "easeInOut" },
      });
    }
    prevErrors.current = result.errors.length;
  }, [result.compatible, result.errors.length, controls]);

  // También sacudir en el mount si hay errores
  useEffect(() => {
    if (!result.compatible && result.errors.length > 0) {
      controls.start({
        x: [0, -10, 9, -7, 6, -4, 3, 0],
        transition: { duration: 0.55, ease: "easeInOut" },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.compatible ? "compatible" : `error-${result.errors.join("")}`}
        animate={controls}
        initial={{ opacity: 0, y: 6 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3 transition-colors duration-500",
            result.compatible
              ? "border-emerald-500/40 bg-emerald-500/5 animate-pulse-green"
              : "border-red-500/40 bg-red-500/5 animate-pulse-red"
          )}
        >
          {/* ── Status header ─────────────────────────────────────────── */}
          <div className={cn(
            "flex items-center gap-2.5 font-semibold text-sm",
            result.compatible ? "text-emerald-400" : "text-red-400"
          )}>
            {result.compatible
              ? <ShieldCheck size={17} className="flex-shrink-0" />
              : <XCircle    size={17} className="flex-shrink-0" />
            }
            <span>{result.compatible ? "BUILD COMPATIBLE" : "INCOMPATIBILIDAD DETECTADA"}</span>
            {result.compatible && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="ml-auto"
              >
                <CheckCircle2 size={15} className="text-emerald-400" />
              </motion.span>
            )}
          </div>

          {/* ── Errors ────────────────────────────────────────────────── */}
          {result.errors.length > 0 && (
            <ul className="space-y-2">
              {result.errors.map((error, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-2.5 text-xs bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  <XCircle size={13} className="mt-0.5 flex-shrink-0 text-red-500" />
                  <span className="text-red-300 leading-relaxed">{error}</span>
                </motion.li>
              ))}
            </ul>
          )}

          {/* ── Warnings ──────────────────────────────────────────────── */}
          {result.warnings.length > 0 && (
            <ul className={cn(
              "space-y-2",
              result.errors.length > 0 && "pt-2 border-t border-gray-700/40"
            )}>
              {result.warnings.map((warning, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-2.5 text-xs bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2"
                >
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <span className="text-amber-300 leading-relaxed">{warning}</span>
                </motion.li>
              ))}
            </ul>
          )}

          {/* ── All clear ─────────────────────────────────────────────── */}
          {result.compatible && result.errors.length === 0 && result.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-400/70 font-mono">
              <Zap size={11} />
              Todos los componentes son compatibles entre sí.
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
