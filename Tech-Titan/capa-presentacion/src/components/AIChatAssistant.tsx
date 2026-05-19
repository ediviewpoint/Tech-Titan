"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { Bot, X, Send } from "lucide-react";
import { usePCBuilderStore, selectSelectedProducts } from "@/store/pc-builder";
import { cn } from "@/lib/utils";
import type { HardwareProduct } from "@/types/hardware";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id:      string;
  role:    "user" | "assistant";
  content: string;
}

// ─── Build context formatter ──────────────────────────────────────────────────

function formatBuildContext(products: HardwareProduct[]): string {
  if (products.length === 0) return "Sin componentes seleccionados.";
  return products
    .map((p) => {
      const specs = [
        p.metadata.socket_type    && `Socket ${p.metadata.socket_type}`,
        p.metadata.tdp_watts      && `${p.metadata.tdp_watts}W TDP`,
        p.metadata.ram_generation && p.metadata.ram_generation,
        p.metadata.form_factor    && p.metadata.form_factor,
      ]
        .filter(Boolean)
        .join(", ");
      return `${p.category}: ${p.name}${specs ? ` (${specs})` : ""}`;
    })
    .join(" | ");
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AIChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

const WELCOME: ChatMessage = {
  id:      "welcome",
  role:    "assistant",
  content: "¡Hola! Soy el asistente AI de Tech-Titan. Puedo ayudarte a optimizar tu build y presupuesto. ¿En qué puedo ayudarte?",
};

export function AIChatAssistant({ isOpen, onToggle }: AIChatAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  const selectedProducts = usePCBuilderStore(useShallow(selectSelectedProducts));
  const buildContext     = formatBuildContext(selectedProducts);

  const [messages,    setMessages]    = useState<ChatMessage[]>([WELCOME]);
  const [input,       setInput]       = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          data:     { buildContext },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("API error");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith('0:"')) {
            try {
              const token = JSON.parse(line.slice(2)) as string;
              accumulated += token;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
              );
            } catch { /* skip malformed token */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Error al contactar el asistente. Intenta de nuevo." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const assistantCount = messages.filter((m) => m.role === "assistant").length - 1;

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-72 sm:w-80 flex flex-col"
          >
            <div
              className="glass rounded-2xl border border-cyan-500/25 flex flex-col overflow-hidden shadow-neon-sm"
              style={{ maxHeight: "60vh", minHeight: "300px" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <Bot size={14} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Tech-Titan AI</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {selectedProducts.length > 0
                        ? `${selectedProducts.length} componente${selectedProducts.length > 1 ? "s" : ""} en build`
                        : "Sin componentes aún"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="text-gray-600 hover:text-gray-400 transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/25"
                          : "bg-gray-800/60 text-gray-200 border border-gray-700/40"
                      )}
                    >
                      {msg.content || (msg.role === "assistant" && isStreaming ? <TypingDots /> : null)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Build context strip */}
              {selectedProducts.length > 0 && (
                <div className="px-3 py-1.5 bg-cyan-500/5 border-t border-cyan-500/10 flex-shrink-0">
                  <p className="text-[10px] font-mono text-cyan-700 truncate">
                    📦 {buildContext}
                  </p>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={onFormSubmit}
                className="border-t border-gray-800/60 p-3 flex gap-2 flex-shrink-0"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre tu build..."
                  className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="w-8 h-8 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Send size={12} className="text-gray-950" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className={cn(
          "fixed bottom-5 right-4 sm:right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
          isOpen
            ? "glass border border-gray-700"
            : "bg-cyan-500 hover:bg-cyan-400 shadow-neon-sm hover:shadow-neon-md"
        )}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Cerrar asistente AI" : "Abrir asistente AI"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={18} className="text-gray-400" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot size={18} className="text-gray-950" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Unread badge */}
      {!isOpen && assistantCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-14 right-3 sm:right-5 z-50 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold pointer-events-none"
        >
          {assistantCount > 9 ? "9+" : assistantCount}
        </motion.div>
      )}
    </>
  );
}
