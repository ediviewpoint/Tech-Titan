"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { HardwareIcon } from "./HardwareIcon";
import { cn } from "@/lib/utils";
import type { HardwareProduct } from "@/types/hardware";

// ─── Data stream parser (AI SDK format: `0:"text"\n`) ─────────────────────────

function parseDataChunk(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => line.startsWith('0:"') || line.startsWith("0:'"))
    .map((line) => {
      try {
        return JSON.parse(line.slice(2)) as string;
      } catch {
        return "";
      }
    })
    .join("");
}

// ─── Typewriter cursor ────────────────────────────────────────────────────────

function Cursor({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.span
      className="inline-block w-0.5 h-4 ml-0.5 align-middle"
      style={{ background: "#7000ff" }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  );
}

// ─── Loading dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: "#7000ff" }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
      <span className="text-xs font-mono ml-2"
        style={{ color: "rgba(112,0,255,0.6)" }}>
        ANALIZANDO...
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIAuditModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  components: HardwareProduct[];
  totalPrice: number;
  totalTdp:   number;
}

// ─── AIAuditModal ─────────────────────────────────────────────────────────────

export function AIAuditModal({
  isOpen, onClose, components, totalPrice, totalTdp,
}: AIAuditModalProps) {
  const [text,      setText]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [provider,  setProvider]  = useState<string>("AI");
  const scrollRef   = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // Stream the audit when modal opens
  const runAudit = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setText("");
    setError(null);
    setDone(false);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-expert", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          components: components.map((c) => ({
            category: c.category,
            name:     c.name,
            metadata: c.metadata,
            price:    c.price_usd,
          })),
          totalPrice,
          totalTdp,
        }),
        signal: abortRef.current.signal,
      });

      setProvider(res.headers.get("X-AI-Provider") ?? "AI");

      if (!res.body) throw new Error("Sin stream de respuesta");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const chunk = decoder.decode(value, { stream: true });
        const token = parseDataChunk(chunk);
        if (token) setText((prev) => prev + token);
      }

      setDone(true);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      setError("No se pudo conectar al sistema de IA. Verifica tu API key en .env.local");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [components, totalPrice, totalTdp]);

  useEffect(() => {
    if (isOpen && components.length > 0) runAudit();
    return () => { abortRef.current?.abort(); };
  }, [isOpen, runAudit]);

  // Auto-scroll as text arrives
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [text]);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const isCompatible = done && !error && text.includes("VALIDADO ✓");
  const isIncomplete = done && !error && text.includes("INCOMPLETO");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="audit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(7,9,14,0.85)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="audit-modal"
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0,
                transition: { type: "spring", stiffness: 260, damping: 22 } }}
              exit={{ opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full max-w-lg"
            >
              {/* Card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background:  "rgba(13,17,23,0.95)",
                  border:      "1px solid rgba(112,0,255,0.4)",
                  boxShadow:   "0 0 0 1px rgba(112,0,255,0.15), 0 0 60px rgba(112,0,255,0.2), 0 32px 80px rgba(0,0,0,0.7)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(112,0,255,0.2)" }}>
                  {/* Purple glow icon */}
                  <motion.div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(112,0,255,0.15)", border: "1px solid rgba(112,0,255,0.35)" }}
                    animate={loading ? { boxShadow: ["0 0 8px rgba(112,0,255,0.4)", "0 0 20px rgba(112,0,255,0.8)", "0 0 8px rgba(112,0,255,0.4)"] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles size={16} style={{ color: "#b060ff" }} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      Tech-Titan AI — Auditoría de Build
                    </h2>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(112,0,255,0.6)" }}>
                      {loading ? "PROCESANDO..." : done ? `AUDITORÍA COMPLETA · ${provider}` : "EN ESPERA"}
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded-lg flex-shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* ── Components being audited ───────────────────────── */}
                <div className="px-5 pt-4 pb-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest mb-2"
                    style={{ color: "rgba(112,0,255,0.5)" }}>
                    Componentes analizados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {components.length === 0 ? (
                      <span className="text-xs text-gray-600 font-mono italic">
                        Sin componentes seleccionados
                      </span>
                    ) : components.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md"
                        style={{ background: "rgba(112,0,255,0.08)", border: "1px solid rgba(112,0,255,0.2)", color: "#b060ff" }}
                      >
                        <HardwareIcon category={c.category} size={10} className="text-current" />
                        {c.name.split(" ").slice(0, 3).join(" ")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 my-3" style={{ height: "1px", background: "rgba(112,0,255,0.15)" }} />

                {/* ── AI output ─────────────────────────────────────── */}
                <div
                  ref={scrollRef}
                  className="px-5 pb-2"
                  style={{ minHeight: "140px", maxHeight: "320px", overflowY: "auto" }}
                >
                  {/* Loading state */}
                  {loading && text.length === 0 && <LoadingDots />}

                  {/* No components warning */}
                  {!loading && components.length === 0 && (
                    <div className="flex items-start gap-2 py-4">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-400">
                        Selecciona al menos un componente en el PC Builder para iniciar la auditoría.
                      </p>
                    </div>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="flex items-start gap-2 py-4">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Streaming text */}
                  {text && (
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
                      style={{ color: "#c8d8e8" }}>
                      {text}
                      <Cursor show={!done} />
                    </pre>
                  )}
                </div>

                {/* ── Status footer ──────────────────────────────────── */}
                {done && !error && (
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: "1px solid rgba(112,0,255,0.15)" }}
                  >
                    <div className={cn(
                      "flex items-center gap-1.5 text-[11px] font-mono",
                      isCompatible ? "text-emerald-400" : isIncomplete ? "text-amber-400" : "text-gray-500"
                    )}>
                      <CheckCircle2 size={12} />
                      {isCompatible ? "AUDITORÍA APROBADA" : isIncomplete ? "BUILD INCOMPLETO" : "ANÁLISIS COMPLETADO"}
                    </div>
                    <button
                      onClick={runAudit}
                      className="text-[11px] font-mono px-3 py-1 rounded-lg transition-colors"
                      style={{
                        color: "#b060ff",
                        background: "rgba(112,0,255,0.08)",
                        border: "1px solid rgba(112,0,255,0.2)",
                      }}
                    >
                      Re-analizar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
