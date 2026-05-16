"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Plus } from "lucide-react";
import { HardwareSVG } from "./icons/HardwareIcons";
import { cn } from "@/lib/utils";
import type { HardwareProduct } from "@/types/hardware";

// ─── Mini spec badges with inline SVG icons ───────────────────────────────────

function SocketBadge({ socket }: { socket: string }) {
  return (
    <span className="inline-flex items-center gap-1 badge-cyan text-[10px] px-1.5 py-0.5">
      {/* Mini LGA pin grid */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        {[2,5,8].map((x) => [2,5,8].map((y) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="0.8"
            fill="currentColor" fillOpacity="0.8"/>
        )))}
      </svg>
      {socket}
    </span>
  );
}

function RAMBadge({ gen }: { gen: string }) {
  return (
    <span className="inline-flex items-center gap-1 badge-emerald text-[10px] px-1.5 py-0.5">
      {/* Mini DIMM contact lines */}
      <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
        <rect x="1" y="0" width="6" height="8" rx="0.5"
          stroke="currentColor" strokeWidth="0.8" fill="none" strokeOpacity="0.7"/>
        {[2,3.5,5].map((x) => (
          <line key={x} x1={x} y1="8" x2={x} y2="10"
            stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.9"/>
        ))}
      </svg>
      {gen}
    </span>
  );
}

function TDPBadge({ watts }: { watts: number }) {
  return (
    <span className="inline-flex items-center gap-1 badge-amber text-[10px] px-1.5 py-0.5">
      {/* Mini lightning bolt */}
      <svg width="7" height="10" viewBox="0 0 7 10" fill="currentColor">
        <path d="M4.5 0 L1 5.5 H3.5 L2.5 10 L6 4.5 H3.5 Z" fillOpacity="0.9"/>
      </svg>
      {watts}W
    </span>
  );
}

function WattageBadge({ watts }: { watts: number }) {
  return (
    <span className="inline-flex items-center gap-1 badge-purple text-[10px] px-1.5 py-0.5">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.8"/>
        <circle cx="4" cy="4" r="1.2" fill="currentColor" fillOpacity="0.7"/>
      </svg>
      {watts}W PSU
    </span>
  );
}

function FormBadge({ form }: { form: string }) {
  return (
    <span className="inline-flex items-center gap-1 badge-gray text-[10px] px-1.5 py-0.5">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <rect x="0.5" y="0.5" width="9" height="7" rx="0.5"
          stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" fill="none"/>
        <rect x="2" y="2" width="3" height="4" rx="0.3"
          fill="currentColor" fillOpacity="0.4"/>
      </svg>
      {form}
    </span>
  );
}

// ─── Category gradient backgrounds ────────────────────────────────────────────

const CATEGORY_GRADIENT: Record<string, string> = {
  CPU:         "from-cyan-500/15  via-blue-600/10  to-transparent",
  Motherboard: "from-violet-500/15 via-indigo-600/10 to-transparent",
  RAM:         "from-emerald-500/15 via-green-600/10 to-transparent",
  GPU:         "from-pink-500/15  via-purple-600/10 to-transparent",
  PSU:         "from-amber-500/15  via-orange-600/10 to-transparent",
  Storage:     "from-gray-400/12   via-gray-600/8   to-transparent",
};

// ─── ProductCard ──────────────────────────────────────────────────────────────

export interface ProductCardProps {
  product:    HardwareProduct;
  isSelected: boolean;
  onSelect:   (product: HardwareProduct) => void;
  animIndex?: number;
  glowState?: "compatible" | "incompatible" | null;
}

export default function ProductCard({
  product, isSelected, onSelect, animIndex = 0, glowState = null,
}: ProductCardProps) {
  const { metadata }   = product;
  const gradient       = CATEGORY_GRADIENT[product.category] ?? CATEGORY_GRADIENT.CPU;

  // Card border/bg based on selection + glow state
  const cardState = isSelected
    ? glowState === "incompatible" ? "hw-card-incompatible"
    : "hw-card-selected"
    : "";

  return (
    <motion.button
      onClick={() => onSelect(product)}
      aria-pressed={isSelected}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animIndex * 0.07, ease: "easeOut" }}
      whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-left rounded-xl overflow-hidden transition-all duration-300 group",
        "glass-card-hover",
        cardState
      )}
    >
      {/* ── Image / SVG area ─────────────────────────────────────────── */}
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br h-32",
        gradient
      )}>
        {/* Scanline overlay */}
        <div className="scanline" aria-hidden />

        {/* Hardware SVG — scales with animation on selection */}
        <motion.div
          animate={isSelected ? { scale: 1.08 } : { scale: 1 }}
          transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 18 }}
          className="relative z-10"
        >
          <HardwareSVG
            category={product.category}
            size={52}
            glow={isSelected ? glowState : null}
            className={cn(
              "transition-colors duration-300",
              isSelected
                ? glowState === "incompatible" ? "text-red-400"
                : "text-cyan-300"
                : "text-gray-500 group-hover:text-cyan-400"
            )}
          />
        </motion.div>

        {/* Category label */}
        <span className="absolute top-2 left-3 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          {product.category}
        </span>

        {/* Selected badge */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2"
          >
            <CheckCircle2
              size={18}
              className={glowState === "incompatible" ? "text-red-400" : "text-cyan-400"}
            />
          </motion.div>
        )}

        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d1117]/60 to-transparent"/>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Spec badges with mini SVG icons */}
        <div className="flex flex-wrap gap-1.5">
          {metadata.socket_type    && <SocketBadge  socket={metadata.socket_type} />}
          {metadata.ram_generation && <RAMBadge     gen={metadata.ram_generation} />}
          {metadata.form_factor    && <FormBadge    form={metadata.form_factor} />}
          {metadata.tdp_watts      && <TDPBadge     watts={metadata.tdp_watts} />}
          {metadata.wattage_watts  && <WattageBadge watts={metadata.wattage_watts} />}
        </div>

        {/* Price */}
        {product.price !== undefined && (
          <p className={cn(
            "text-lg font-bold font-mono",
            isSelected
              ? glowState === "incompatible" ? "text-red-400" : "gradient-text-accent"
              : "text-cyan-400"
          )}>
            ${product.price.toLocaleString()}
            <span className="text-xs text-gray-600 ml-1 font-normal">USD</span>
          </p>
        )}

        {/* CTA row */}
        <div className={cn(
          "flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200",
          isSelected
            ? glowState === "incompatible"
              ? "bg-red-500/15 text-red-400 border border-red-500/30"
              : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
            : "bg-white/[0.03] text-gray-500 border border-white/[0.07] group-hover:bg-cyan-500/10 group-hover:text-cyan-400 group-hover:border-cyan-500/20"
        )}>
          {isSelected ? (
            <><CheckCircle2 size={12} /> SELECCIONADO</>
          ) : (
            <><Plus size={12} /> AGREGAR AL BUILD</>
          )}
        </div>
      </div>
    </motion.button>
  );
}
