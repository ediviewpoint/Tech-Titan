import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

// ─── CPU Skeleton ─────────────────────────────────────────────────────────────

function CPUSkeleton() {
  return (
    <svg width="52" height="52" viewBox="0 0 64 64" fill="none" className="opacity-20">
      {/* IHS */}
      <rect x="11" y="11" width="42" height="42" rx="3"
        fill="rgba(0,242,255,0.15)" stroke="rgba(0,242,255,0.3)" strokeWidth="1.4"/>
      {/* Die */}
      <rect x="21" y="21" width="22" height="22" rx="2"
        fill="rgba(0,242,255,0.08)" stroke="rgba(0,242,255,0.2)" strokeWidth="1"/>
      {/* Pins */}
      {[14,22,30,38,46].map((x) => (
        <rect key={`pt${x}`} x={x} y={5} width="2" height="6" rx="0.5"
          fill="rgba(0,242,255,0.25)"/>
      ))}
      {[14,22,30,38,46].map((x) => (
        <rect key={`pb${x}`} x={x} y={53} width="2" height="6" rx="0.5"
          fill="rgba(0,242,255,0.25)"/>
      ))}
      {[14,22,30,38,46].map((y) => (
        <rect key={`pl${y}`} x={5} y={y} width="6" height="2" rx="0.5"
          fill="rgba(0,242,255,0.25)"/>
      ))}
      {[14,22,30,38,46].map((y) => (
        <rect key={`pr${y}`} x={53} y={y} width="6" height="2" rx="0.5"
          fill="rgba(0,242,255,0.25)"/>
      ))}
    </svg>
  );
}

// ─── Generic hardware-shaped skeleton ────────────────────────────────────────

function HardwareShapeSkeleton({ category }: { category?: string }) {
  if (category === "CPU") return <CPUSkeleton />;
  // Default: a stylized chip outline
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-15">
      <rect x="8" y="8" width="32" height="32" rx="3"
        stroke="rgba(0,242,255,0.4)" strokeWidth="1.2" fill="rgba(0,242,255,0.05)"/>
      <rect x="16" y="16" width="16" height="16" rx="1"
        stroke="rgba(0,242,255,0.3)" strokeWidth="0.8" fill="none"/>
      {[10,16,22,28,34,38].map((v) => (
        <rect key={v} x={v} y={3} width="2" height="5" rx="0.4"
          fill="rgba(0,242,255,0.3)"/>
      ))}
      {[10,16,22,28,34,38].map((v) => (
        <rect key={v} x={v} y={40} width="2" height="5" rx="0.4"
          fill="rgba(0,242,255,0.3)"/>
      ))}
    </svg>
  );
}

// ─── Full ProductCard skeleton ────────────────────────────────────────────────

export function ProductCardSkeleton({ category }: { category?: string }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {/* Image area — hardware shape */}
      <div className="relative h-32 flex items-center justify-center bg-gradient-to-br from-cyan-500/5 to-transparent overflow-hidden">
        {/* Scanline shimmer */}
        <div className="skeleton absolute inset-0 rounded-none" />
        <HardwareShapeSkeleton category={category} />
        {/* Category label skeleton */}
        <div className="absolute top-2 left-3 h-2 w-16 skeleton rounded"/>
      </div>

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>

        {/* Spec badges */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>

        {/* Price */}
        <Skeleton className="h-6 w-24" />

        {/* CTA */}
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Build Manifest slot skeleton ─────────────────────────────────────────────

export function ManifestSlotSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/[0.06] animate-pulse">
      <div className="w-1.5 h-1.5 rounded-full bg-white/10 flex-shrink-0"/>
      <div className="w-6 h-6 rounded skeleton flex-shrink-0"/>
      <div className="flex-1 space-y-1">
        <Skeleton className="h-2 w-12"/>
        <Skeleton className="h-3 w-28"/>
      </div>
      <Skeleton className="h-4 w-8"/>
    </div>
  );
}
