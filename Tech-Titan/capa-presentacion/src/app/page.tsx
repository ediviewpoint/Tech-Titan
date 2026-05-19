"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Cpu, Database, Zap, Shield, CheckCircle2, Layers } from "lucide-react";

// ─── 1. BackgroundGrid — Perspectiva estilo Tron + líneas de horizonte ─────────

function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
      {/* Deep space base */}
      <div className="absolute inset-0" style={{ background: "#0d1117" }} />

      {/* Starfield: tiny scattered dots via multiple radial gradients */}
      <div className="absolute inset-0" style={{
        backgroundImage: [
          "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          "radial-gradient(circle, rgba(0,242,255,0.6) 1px, transparent 1px)",
          "radial-gradient(circle, rgba(112,0,255,0.5) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "200px 200px, 150px 150px, 300px 300px",
        backgroundPosition: "0 0, 100px 50px, 40px 80px",
        opacity: 0.18,
      }} />

      {/* ── Floor grid: perspective rotateX ──────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "62vh",
          backgroundImage: [
            "linear-gradient(rgba(112,0,255,0.22) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(112,0,255,0.22) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "80px 80px",
          transform: "perspective(380px) rotateX(76deg)",
          transformOrigin: "bottom center",
          animation: "gridScroll 2.8s linear infinite",
        }}
      />

      {/* Grid fade — makes horizon disappear into darkness */}
      <div className="absolute inset-x-0 bottom-0" style={{
        height: "62vh",
        background: "linear-gradient(to bottom, #0d1117 0%, rgba(13,17,23,0.15) 45%, transparent 100%)",
      }} />

      {/* Horizon glow line */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "calc(62vh * 0.07)",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(112,0,255,0.9) 25%, rgba(0,242,255,0.7) 50%, rgba(112,0,255,0.9) 75%, transparent 100%)",
          animation: "horizonPulse 3s ease-in-out infinite",
        }}
      />

      {/* Secondary horizon line */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "calc(62vh * 0.07 + 4px)",
          height: "1px",
          background: "linear-gradient(90deg, transparent 15%, rgba(112,0,255,0.3) 40%, rgba(0,242,255,0.2) 50%, rgba(112,0,255,0.3) 60%, transparent 85%)",
          opacity: 0.6,
        }}
      />

      {/* Deep center radial glow behind hero */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 45% at 50% 45%, rgba(112,0,255,0.07) 0%, transparent 70%)",
      }} />

      {/* Top fade — blends background into darkness for the text area */}
      <div className="absolute inset-x-0 top-0" style={{
        height: "50%",
        background: "linear-gradient(to bottom, #0d1117 0%, rgba(13,17,23,0.6) 60%, transparent 100%)",
      }} />
    </div>
  );
}

// ─── 2. FloatingParticles — partículas de luz con Framer Motion ────────────────

interface Particle {
  id: number; x: number; y: number;
  size: number; duration: number; delay: number; color: string;
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Client-only: avita mismatch de hidratación
    const palette = ["#00f2ff", "#7000ff", "#00e896", "#ffffff", "#b060ff", "#00f2ff"];
    setParticles(
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.2 + 0.8,
        duration: Math.random() * 10 + 7,
        delay: Math.random() * 7,
        color: palette[i % palette.length]!,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}80`,
          }}
          animate={{
            y: [-8, -40, -8],
            opacity: [0.08, 0.65, 0.08],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── 3. ScanLine — barrido horizontal periódico ────────────────────────────────

function ScanLine() {
  return (
    <motion.div
      className="fixed inset-x-0 h-px pointer-events-none z-20"
      style={{
        background: "linear-gradient(90deg, transparent 5%, rgba(0,242,255,0.6) 40%, rgba(0,242,255,0.9) 50%, rgba(0,242,255,0.6) 60%, transparent 95%)",
        boxShadow: "0 0 12px rgba(0,242,255,0.5), 0 0 30px rgba(0,242,255,0.2)",
      }}
      initial={{ top: "-1px", opacity: 0 }}
      animate={{ top: ["0%", "100%"], opacity: [0, 0.8, 0.8, 0] }}
      transition={{
        duration: 5,
        times: [0, 0.05, 0.95, 1],
        repeat: Infinity,
        repeatDelay: 8,
        ease: "linear",
      }}
    />
  );
}

// ─── 4. HUD corners — decoraciones de esquinas tipo cyberpunk ──────────────────

function HUDCorners() {
  const corners = [
    { cls: "top-4 left-4 sm:top-6 sm:left-6",   border: "border-t border-l" },
    { cls: "top-4 right-4 sm:top-6 sm:right-6",  border: "border-t border-r" },
    { cls: "bottom-4 left-4 sm:bottom-6 sm:left-6",  border: "border-b border-l" },
    { cls: "bottom-4 right-4 sm:bottom-6 sm:right-6", border: "border-b border-r" },
  ];
  return (
    <>
      {corners.map(({ cls, border }, i) => (
        <motion.div
          key={i}
          className={`fixed w-7 h-7 sm:w-9 sm:h-9 pointer-events-none ${cls} ${border}`}
          style={{ borderColor: "rgba(0,242,255,0.25)", borderWidth: "1.5px" }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.0 + i * 0.08, duration: 0.4, ease: "backOut" }}
        />
      ))}
    </>
  );
}

// ─── 5. Ticker — readouts técnicos en la parte inferior ────────────────────────

const TICKER_ITEMS = [
  "POSTGRES:5433",
  "REDIS:6379",
  "EXPRESS:9000",
  "NEXT.JS:3000",
  "LATENCY:<1ms",
  "UPTIME:100%",
  "BUILD:COMPATIBLE",
  "REGLAS:5 ACTIVAS",
];

function Ticker() {
  return (
    <div className="fixed bottom-0 inset-x-0 pointer-events-none z-10 overflow-hidden"
      style={{
        borderTop: "1px solid rgba(0,242,255,0.08)",
        background: "rgba(13,17,23,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        className="flex gap-8 py-1.5 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="text-[10px] font-mono flex items-center gap-2"
            style={{ color: "rgba(0,242,255,0.35)" }}>
            <span style={{ color: "rgba(112,0,255,0.5)" }}>◆</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── 6. Tech stack pills ───────────────────────────────────────────────────────

const STACK: { label: string; color: string }[] = [
  { label: "Next.js 14",     color: "#ffffff" },
  { label: "Express.js",     color: "#00f2ff" },
  { label: "PostgreSQL 15",  color: "#4b8fcc" },
  { label: "Redis 7",        color: "#ff6b6b" },
  { label: "TypeScript",     color: "#3b82f6" },
  { label: "Zod Schema",     color: "#00e896" },
  { label: "Zustand",        color: "#b060ff" },
  { label: "TanStack Query", color: "#f97316" },
  { label: "Framer Motion",  color: "#e879f9" },
];

// ─── 7. Stat counters ──────────────────────────────────────────────────────────

function CountUp({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0;
      const step = target / 40;
      const id = setInterval(() => {
        start += step;
        if (start >= target) { clearInterval(id); setValue(target); }
        else setValue(Math.floor(start));
      }, 30);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{value}</>;
}

// ─── 8. Main page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Ease curve for title words
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pb-10 overflow-hidden">

      {/* ── Environment layers ──────────────────────────────────────────── */}
      <BackgroundGrid />
      <FloatingParticles />
      <ScanLine />
      <HUDCorners />
      <Ticker />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-8 sm:gap-10">

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full"
          style={{
            background: "rgba(0,242,255,0.06)",
            border: "1px solid rgba(0,242,255,0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-[#00f2ff]"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ boxShadow: "0 0 8px #00f2ff" }}
          />
          <span className="text-[11px] font-mono tracking-widest"
            style={{ color: "#00f2ff" }}>
            MOTOR DE COMPATIBILIDAD · SISTEMA ACTIVO · LATAM
          </span>
        </motion.div>

        {/* ── Hero title ──────────────────────────────────────────────── */}
        <div className="space-y-1 sm:space-y-2">

          {/* Line 1: "Construye la" */}
          <div className="flex flex-wrap justify-center items-baseline gap-x-4 sm:gap-x-6 overflow-hidden">
            {["Construye", "la"].map((word, i) => (
              <motion.span
                key={word}
                initial={{ y: 100, opacity: 0, filter: "blur(16px)" }}
                animate={mounted ? { y: 0, opacity: 1, filter: "blur(0px)" } : {}}
                transition={{ delay: 0.5 + i * 0.18, duration: 0.8, ease }}
                className="font-black tracking-tighter text-white"
                style={{ fontSize: "clamp(3rem, 9vw, 8.5rem)", lineHeight: 1 }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Line 2: "Máquina" — cyan→purple gradient */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: 100, opacity: 0, filter: "blur(20px)" }}
              animate={mounted ? { y: 0, opacity: 1, filter: "blur(0px)" } : {}}
              transition={{ delay: 0.85, duration: 0.85, ease }}
            >
              <span
                className="font-black tracking-tighter block"
                style={{
                  fontSize: "clamp(3rem, 9vw, 8.5rem)",
                  lineHeight: 1,
                  background: "linear-gradient(120deg, #00f2ff 0%, #7000ff 65%, #b060ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Máquina
              </span>
            </motion.div>
          </div>

          {/* Line 3: "Definitiva" — neon cyan con glow expansivo */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: 100, opacity: 0, filter: "blur(24px)" }}
              animate={mounted ? { y: 0, opacity: 1, filter: "blur(0px)" } : {}}
              transition={{ delay: 1.1, duration: 0.9, ease }}
            >
              <motion.span
                className="font-black tracking-tighter block"
                style={{
                  fontSize: "clamp(3rem, 9vw, 8.5rem)",
                  lineHeight: 1,
                  color: "#00f2ff",
                }}
                animate={{
                  textShadow: [
                    "0 0 20px rgba(0,242,255,0.5), 0 0 60px rgba(0,242,255,0.2)",
                    "0 0 40px rgba(0,242,255,0.8), 0 0 100px rgba(0,242,255,0.4), 0 0 160px rgba(0,242,255,0.15)",
                    "0 0 20px rgba(0,242,255,0.5), 0 0 60px rgba(0,242,255,0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Definitiva
              </motion.span>
            </motion.div>
          </div>
        </div>

        {/* ── Subtitle ────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="max-w-xl sm:max-w-2xl text-base sm:text-lg leading-relaxed"
          style={{ color: "#6b7f99" }}
        >
          El primer{" "}
          <span style={{ color: "#00f2ff", fontWeight: 600 }}>
            motor de compatibilidad de hardware
          </span>{" "}
          impulsado por reglas de negocio estrictas.{" "}
          <br className="hidden sm:block" />
          Selecciona, valida y{" "}
          <span style={{ color: "#b060ff", fontWeight: 600 }}>domina</span>.
        </motion.p>

        {/* ── CTA Button ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, filter: "blur(12px)" }}
          animate={mounted ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
          transition={{ delay: 1.95, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Link href="/pc-builder" className="group relative inline-flex">

            {/* Animated glow ring behind button */}
            <motion.div
              className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,242,255,0.35) 0%, transparent 65%)",
                transform: "scale(1.8)",
                transition: "opacity 0.3s",
                filter: "blur(8px)",
              }}
            />

            {/* Pulse ring — always animating */}
            <motion.div
              className="absolute inset-0 rounded-[20px]"
              style={{ border: "1px solid rgba(0,242,255,0.4)" }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="relative z-10 flex items-center gap-3.5 font-bold tracking-wide"
              style={{
                padding: "1.1rem 3rem",
                borderRadius: "1.25rem",
                fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                background: "linear-gradient(135deg, #00f2ff 0%, #00c8e0 50%, #0099b5 100%)",
                color: "#0d1117",
                boxShadow: "0 0 32px rgba(0,242,255,0.55), 0 0 90px rgba(0,242,255,0.2), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <span>Inicializar Sistema</span>
              <motion.span
                animate={{ x: [0, 7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={22} strokeWidth={2.5} />
              </motion.span>
            </motion.button>
          </Link>
        </motion.div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="flex items-center gap-6 sm:gap-10 flex-wrap justify-center"
        >
          {[
            { icon: Database,     value: "70",   unit: "productos",       color: "#00f2ff" },
            { icon: Shield,       value: "5",    unit: "reglas activas",  color: "#00e896" },
            { icon: Layers,       value: "8",    unit: "categorías",      color: "#b060ff" },
            { icon: Zap,          value: "<1ms", unit: "latencia API",    color: "#ffaa00" },
          ].map(({ icon: Icon, value, unit, color }, i) => (
            <motion.div
              key={unit}
              initial={{ opacity: 0, y: 16 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 2.3 + i * 0.1 }}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="flex items-center gap-1.5">
                <Icon size={12} style={{ color, opacity: 0.8 }} />
                <span className="text-xl sm:text-2xl font-black font-mono"
                  style={{ color }}>
                  {value}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                {unit}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Tech stack pills ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 2.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-lg"
        >
          {STACK.map((tech, i) => (
            <motion.span
              key={tech.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 2.6 + i * 0.05 }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md"
              style={{
                color: tech.color,
                background: `${tech.color}10`,
                border: `1px solid ${tech.color}22`,
              }}
            >
              {tech.label}
            </motion.span>
          ))}
        </motion.div>
      </main>

      {/* ── Vertical circuit lines (decorative side accents) ────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 2.5 }}
        className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
        aria-hidden
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="w-px"
            style={{
              height: "20px",
              background: i % 3 === 0 ? "rgba(0,242,255,0.4)" : "rgba(112,0,255,0.3)",
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
        <div className="w-2 h-2 rounded-full mt-1" style={{
          background: "#00f2ff",
          boxShadow: "0 0 8px #00f2ff",
        }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 2.5 }}
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
        aria-hidden
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="w-px"
            style={{
              height: "20px",
              background: i % 3 === 0 ? "rgba(112,0,255,0.4)" : "rgba(0,242,255,0.3)",
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, delay: i * 0.15 + 0.5, repeat: Infinity }}
          />
        ))}
        <div className="w-2 h-2 rounded-full mt-1" style={{
          background: "#7000ff",
          boxShadow: "0 0 8px #7000ff",
        }} />
      </motion.div>
    </div>
  );
}
