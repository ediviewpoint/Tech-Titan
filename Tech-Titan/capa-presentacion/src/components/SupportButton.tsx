"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Tipos de ticket ──────────────────────────────────────────────────────────

const TICKET_TYPES = [
  { value: "bug",       label: "🐛 Problema técnico"     },
  { value: "pedido",    label: "📦 Problema con pedido"   },
  { value: "consulta",  label: "❓ Consulta general"      },
  { value: "sugerencia",label: "💡 Sugerencia"            },
] as const;

type TicketType = typeof TICKET_TYPES[number]["value"];

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "59170000000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWaMessage(
  ticketId: string,
  name:     string,
  type:     TicketType,
  desc:     string,
): string {
  const typeLabel = TICKET_TYPES.find((t) => t.value === type)?.label ?? type;
  return [
    "🎫 *TICKET DE SOPORTE — Tech-Titan*",
    "",
    `👤 De: ${name}`,
    `🏷️ Tipo: ${typeLabel}`,
    "",
    desc,
    "",
    `🔑 Ticket ID: #${ticketId.slice(0, 8).toUpperCase()}`,
  ].join("\n");
}

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY = { name: "", email: "", type: "consulta" as TicketType, description: "" };

// ─── SupportButton ────────────────────────────────────────────────────────────

export function SupportButton() {
  const [open,    setOpen]    = useState(false);
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState(EMPTY);

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => { setSent(false); setForm(EMPTY); }, 400);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/backend/store/tickets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        form.name.trim(),
          email:       form.email.trim() || undefined,
          type:        form.type,
          description: form.description.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Error al enviar");
      }

      const ticket = await res.json() as { id: string };

      // Abrir WhatsApp con el ticket pre-cargado
      const waText = buildWaMessage(ticket.id, form.name, form.type, form.description);
      window.open(
        `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`,
        "_blank",
        "noopener,noreferrer"
      );

      setSent(true);
      toast.success("Ticket enviado", {
        description: `ID: #${ticket.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Botón flotante ───────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 left-6 z-40 w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg"
        style={{
          width:      "52px",
          height:     "52px",
          background: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)",
          boxShadow:  "0 0 20px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.5)",
          border:     "1px solid rgba(6,182,212,0.35)",
        }}
        title="Soporte / Reportar problema"
        aria-label="Abrir soporte"
      >
        <MessageSquarePlus size={22} className="text-white" />
      </motion.button>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={resetAndClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-sm"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(10,12,20,0.97)",
                  border:     "1px solid rgba(6,182,212,0.2)",
                  boxShadow:  "0 0 40px rgba(6,182,212,0.12), 0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(6,182,212,0.12)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.25)" }}
                    >
                      <MessageSquarePlus size={14} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Soporte</p>
                      <p className="text-[10px] text-gray-500 font-mono">Te respondemos por WhatsApp</p>
                    </div>
                  </div>
                  <button
                    onClick={resetAndClose}
                    className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800/60"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-5">
                  <AnimatePresence mode="wait">
                    {sent ? (
                      /* ── Estado enviado ─────────────────────────── */
                      <motion.div
                        key="sent"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6 space-y-4"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            background: "rgba(16,185,129,0.12)",
                            border:     "2px solid rgba(16,185,129,0.4)",
                            boxShadow:  "0 0 24px rgba(16,185,129,0.25)",
                          }}
                        >
                          <CheckCircle2 size={32} className="text-emerald-400" strokeWidth={1.5} />
                        </motion.div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-white">¡Ticket enviado!</p>
                          <p className="text-xs text-gray-400">
                            WhatsApp se abrió con tu reporte. Te respondemos pronto.
                          </p>
                        </div>
                        <button
                          onClick={resetAndClose}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/8 transition-colors"
                        >
                          Cerrar
                        </button>
                      </motion.div>
                    ) : (
                      /* ── Formulario ─────────────────────────────── */
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSubmit}
                        className="space-y-3"
                      >
                        {/* Nombre */}
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">
                            Tu nombre *
                          </label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: Juan Mamani"
                            maxLength={255}
                            disabled={loading}
                            className="w-full bg-gray-900/70 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15 transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">
                            Email (opcional)
                          </label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="tu@email.com"
                            disabled={loading}
                            className="w-full bg-gray-900/70 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15 transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Tipo */}
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">
                            Tipo de consulta *
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {TICKET_TYPES.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                disabled={loading}
                                onClick={() => setForm({ ...form, type: t.value })}
                                className={cn(
                                  "py-2 px-2 rounded-lg text-[11px] font-medium text-left transition-all border",
                                  form.type === t.value
                                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                                    : "bg-gray-900/60 border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                                )}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Descripción */}
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">
                            Describe el problema *
                          </label>
                          <textarea
                            required
                            minLength={5}
                            maxLength={2000}
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Cuéntanos qué pasó con el mayor detalle posible..."
                            disabled={loading}
                            className="w-full bg-gray-900/70 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15 transition-colors resize-none disabled:opacity-50"
                          />
                          <p className="text-[9px] text-gray-700 font-mono text-right mt-0.5">
                            {form.description.length}/2000
                          </p>
                        </div>

                        {/* Botón enviar */}
                        <motion.button
                          type="submit"
                          disabled={loading || !form.name.trim() || !form.description.trim()}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                            boxShadow:  "0 0 20px rgba(37,211,102,0.3)",
                            color:      "#fff",
                          }}
                        >
                          {loading ? (
                            <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                          ) : (
                            <><Send size={15} /> Enviar por WhatsApp</>
                          )}
                        </motion.button>

                        <p className="text-center text-[9px] text-gray-700 font-mono">
                          El ticket se registra y se envía a nuestro WhatsApp
                        </p>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
