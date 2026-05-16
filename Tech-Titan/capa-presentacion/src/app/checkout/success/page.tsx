"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Home } from "lucide-react";

// ─── Confetti ─────────────────────────────────────────────────────────────────

const COLORS = ["#06b6d4", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

interface Particle {
  id:       number;
  color:    string;
  left:     number;
  width:    number;
  height:   number;
  delay:    number;
  duration: number;
  rotate:   number;
  drift:    number;
}

function useParticles(count: number): Particle[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id:       i,
        color:    COLORS[i % COLORS.length]!,
        left:     Math.random() * 100,
        width:    Math.random() * 8 + 4,
        height:   Math.random() * 5 + 3,
        delay:    Math.random() * 1.2,
        duration: Math.random() * 2 + 2.5,
        rotate:   Math.random() * 720 - 360,
        drift:    Math.random() * 60 - 30,
      })),
    [count]
  );
}

function Confetti() {
  const particles = useParticles(55);
  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm pointer-events-none"
          style={{
            width:  p.width,
            height: p.height,
            background: p.color,
            left:   `${p.left}%`,
            top:    "-5%",
          }}
          animate={{
            y:       ["0vh", "115vh"],
            x:       [0, p.drift],
            rotate:  [0, p.rotate],
            opacity: [1, 0.7, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
        />
      ))}
    </>
  );
}

// ─── Order ID (stable per session) ───────────────────────────────────────────

function useOrderId() {
  const [orderId, setOrderId] = useState<string | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("tt-order-id");
    if (stored) {
      setOrderId(stored);
    } else {
      const id = `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      sessionStorage.setItem("tt-order-id", id);
      setOrderId(id);
    }
  }, []);
  return orderId;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const orderId = useOrderId();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden px-4">
      <Confetti />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 65%)" }}
        aria-hidden
      />

      {/* Success card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        className="relative z-10 glass rounded-2xl border border-emerald-500/30 p-8 max-w-md w-full text-center space-y-7"
        style={{ boxShadow: "0 0 60px rgba(16,185,129,0.18), 0 0 0 1px rgba(16,185,129,0.25)" }}
      >
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.55 }}
          className="mx-auto w-20 h-20 rounded-full bg-emerald-500/12 border-2 border-emerald-500/40 flex items-center justify-center"
          style={{ boxShadow: "0 0 32px rgba(16,185,129,0.32)" }}
        >
          <CheckCircle2 size={42} className="text-emerald-400" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-black gradient-text-accent">¡Pago Exitoso!</h1>
          <p className="text-gray-400 text-sm">
            Tu PC ha sido reservada y procesada correctamente.
          </p>
          {orderId && (
            <p className="text-xs font-mono text-gray-500 bg-gray-800/60 border border-gray-700/40 rounded-lg px-4 py-2 inline-block mt-2">
              ORDER # {orderId}
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-3"
        >
          <Link href="/pc-builder" className="btn-ghost flex-1 justify-center text-sm">
            <ArrowLeft size={14} /> PC Builder
          </Link>
          <Link href="/" className="btn-neon flex-1 justify-center text-sm">
            <Home size={14} /> Inicio
          </Link>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-[10px] text-gray-700 font-mono"
        >
          Simulación de pago · No se realizó ningún cargo real
        </motion.p>
      </motion.div>
    </main>
  );
}
