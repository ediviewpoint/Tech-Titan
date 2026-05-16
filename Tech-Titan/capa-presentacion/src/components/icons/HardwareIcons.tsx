/**
 * Biblioteca de iconos SVG técnicos para Tech-Titan PC Builder.
 * Cada componente dibuja la silueta real del hardware: pines, slots, ventiladores.
 * Todos usan currentColor para heredar el color del padre.
 */

interface IconProps {
  size?:      number;
  className?: string;
  glow?:      "compatible" | "incompatible" | null;
}

// ─── CPU ──────────────────────────────────────────────────────────────────────
// IHS + die interior + grid de pines en los 4 lados

export function CPUIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* IHS body */}
      <rect x="11" y="11" width="42" height="42" rx="3"
        fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="1.4"/>

      {/* IHS surface grid */}
      {[19, 26, 33, 40, 47].map((v) => (
        <line key={`h${v}`} x1="11" y1={v} x2="53" y2={v}
          stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.35"/>
      ))}
      {[19, 26, 33, 40, 47].map((v) => (
        <line key={`v${v}`} x1={v} y1="11" x2={v} y2="53"
          stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.35"/>
      ))}

      {/* Die */}
      <rect x="21" y="21" width="22" height="22" rx="2"
        fill="currentColor" fillOpacity="0.18"
        stroke="currentColor" strokeWidth="1"/>

      {/* Die circuitry */}
      {[26, 32, 38].map((v) => (
        <line key={`dh${v}`} x1="21" y1={v} x2="43" y2={v}
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.55"/>
      ))}
      {[26, 32, 38].map((v) => (
        <line key={`dv${v}`} x1={v} y1="21" x2={v} y2="43"
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.55"/>
      ))}

      {/* Pins — top */}
      {[14, 18, 22, 26, 30, 34, 38, 42, 46, 50].map((x) => (
        <rect key={`pt${x}`} x={x} y={5} width="2" height="6" rx="0.5"
          fill="currentColor" fillOpacity="0.8"/>
      ))}
      {/* Pins — bottom */}
      {[14, 18, 22, 26, 30, 34, 38, 42, 46, 50].map((x) => (
        <rect key={`pb${x}`} x={x} y={53} width="2" height="6" rx="0.5"
          fill="currentColor" fillOpacity="0.8"/>
      ))}
      {/* Pins — left */}
      {[14, 18, 22, 26, 30, 34, 38, 42, 46, 50].map((y) => (
        <rect key={`pl${y}`} x={5} y={y} width="6" height="2" rx="0.5"
          fill="currentColor" fillOpacity="0.8"/>
      ))}
      {/* Pins — right */}
      {[14, 18, 22, 26, 30, 34, 38, 42, 46, 50].map((y) => (
        <rect key={`pr${y}`} x={53} y={y} width="6" height="2" rx="0.5"
          fill="currentColor" fillOpacity="0.8"/>
      ))}
    </svg>
  );
}

// ─── Motherboard ──────────────────────────────────────────────────────────────
// PCB + socket AM5/LGA + 4 slots de RAM + slots PCIe + trazas

export function MotherboardIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";
  return (
    <svg
      width={size} height={size} viewBox="0 0 80 64"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* PCB body */}
      <rect x="1" y="1" width="78" height="62" rx="3"
        fill="currentColor" fillOpacity="0.1"
        stroke="currentColor" strokeWidth="1.4"/>

      {/* CPU socket */}
      <rect x="8" y="10" width="24" height="24" rx="2"
        fill="currentColor" fillOpacity="0.08"
        stroke="currentColor" strokeWidth="1"/>
      {/* Socket contact grid */}
      {[0,1,2,3,4].map((row) =>
        [0,1,2,3,4].map((col) => (
          <circle key={`sc${row}${col}`}
            cx={13 + col*3.5} cy={15 + row*3.5} r="0.6"
            fill="currentColor" fillOpacity="0.65"/>
        ))
      )}
      {/* Socket corner notch */}
      <path d="M8 10 L11 10 L11 13 Z" fill="currentColor" fillOpacity="0.4"/>

      {/* RAM slots — 4 vertical */}
      {[38, 46, 54, 62].map((x, i) => (
        <g key={`ram${i}`}>
          <rect x={x} y="8" width="4" height="26" rx="1"
            fill="currentColor" fillOpacity={i < 2 ? 0.2 : 0.1}
            stroke="currentColor" strokeWidth="0.7"
            strokeDasharray={i < 2 ? "none" : "2 1"}/>
          {/* Latch tabs */}
          <rect x={x - 1} y="8" width="2" height="2" rx="0.4"
            fill="currentColor" fillOpacity="0.5"/>
          <rect x={x - 1} y="32" width="2" height="2" rx="0.4"
            fill="currentColor" fillOpacity="0.5"/>
        </g>
      ))}

      {/* PCIe x16 slot */}
      <rect x="8" y="44" width="58" height="5" rx="1"
        fill="currentColor" fillOpacity="0.2"
        stroke="currentColor" strokeWidth="0.8"/>
      {[10,13,16,19,22,25,28,31,34,37,40,43,46,49,52,55,58,61].map((x) => (
        <line key={`pcie${x}`} x1={x} y1="45" x2={x} y2="48"
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5"/>
      ))}
      {/* PCIe key notch */}
      <rect x="37" y="44" width="3" height="5"
        fill="currentColor" fillOpacity="0.35"/>

      {/* PCIe x1 slots */}
      <rect x="8" y="52" width="22" height="4" rx="1"
        fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="0.7"/>
      <rect x="8" y="38" width="22" height="4" rx="1"
        fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="0.7"/>

      {/* Trace lines: CPU → RAM */}
      <path d="M32 20 L38 20" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.45"/>
      <path d="M32 24 L38 24" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.45"/>
      <path d="M32 28 L38 28" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.45"/>
      {/* Trace: CPU → PCIe */}
      <path d="M18 34 L18 38" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.45"/>
      <path d="M22 34 L22 44" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.45"/>
    </svg>
  );
}

// ─── GPU ──────────────────────────────────────────────────────────────────────
// Tarjeta larga + 2 ventiladores con aspas + conector PCIe + outputs

export function GPUIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";

  const FanBlades = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
    <>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r}
        fill="currentColor" fillOpacity="0.08"
        stroke="currentColor" strokeWidth="0.9"/>
      {/* Inner hub */}
      <circle cx={cx} cy={cy} r={r * 0.28}
        fill="currentColor" fillOpacity="0.25"
        stroke="currentColor" strokeWidth="0.6"/>
      {/* Blades × 6 */}
      {[0,60,120,180,240,300].map((deg) => {
        const rad  = (deg * Math.PI) / 180;
        const r1   = r * 0.3;
        const r2   = r * 0.85;
        const off  = 12 * (Math.PI / 180);
        const x1   = cx + Math.cos(rad) * r1;
        const y1   = cy + Math.sin(rad) * r1;
        const x2   = cx + Math.cos(rad + off) * r2;
        const y2   = cy + Math.sin(rad + off) * r2;
        const x3   = cx + Math.cos(rad - off) * r2;
        const y3   = cy + Math.sin(rad - off) * r2;
        return (
          <path key={deg}
            d={`M${cx} ${cy} L${x1} ${y1} L${x2} ${y2} Z M${cx} ${cy} L${x1} ${y1} L${x3} ${y3} Z`}
            fill="currentColor" fillOpacity="0.5"/>
        );
      })}
    </>
  );

  return (
    <svg
      width={size} height={size * 0.65} viewBox="0 0 80 52"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* Card body */}
      <rect x="1" y="5" width="70" height="42" rx="3"
        fill="currentColor" fillOpacity="0.1"
        stroke="currentColor" strokeWidth="1.4"/>

      {/* Heatsink fin lines on top of card */}
      {[4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68].map((x) => (
        <line key={`fin${x}`} x1={x} y1="5" x2={x} y2="47"
          stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2"/>
      ))}

      {/* Fan 1 */}
      <FanBlades cx={20} cy={26} r={13} />
      {/* Fan 2 */}
      <FanBlades cx={50} cy={26} r={13} />

      {/* PCIe connector at right */}
      <rect x="70" y="16" width="10" height="20" rx="1"
        fill="currentColor" fillOpacity="0.25"
        stroke="currentColor" strokeWidth="0.8"/>
      {[1,2,3,4].map((i) => (
        <line key={`pin${i}`} x1="71" y1={17 + i * 4} x2="79" y2={17 + i * 4}
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5"/>
      ))}

      {/* Display outputs at left bracket */}
      {[9,17,25,33].map((y) => (
        <rect key={`dp${y}`} x={1} y={y} width={3} height={5} rx="0.5"
          fill="currentColor" fillOpacity="0.5"/>
      ))}
      {/* Bracket label dots */}
      <circle cx="2.5" cy="7"  r="1" fill="currentColor" fillOpacity="0.35"/>
      <circle cx="2.5" cy="45" r="1" fill="currentColor" fillOpacity="0.35"/>
    </svg>
  );
}

// ─── RAM ──────────────────────────────────────────────────────────────────────
// Stick vertical + chips DRAM + contactos dorados + muesca de orientación

export function RAMIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";
  return (
    <svg
      width={size * 0.42} height={size} viewBox="0 0 28 72"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* PCB */}
      <rect x="1" y="2" width="26" height="64" rx="1.5"
        fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="1.4"/>

      {/* Heatspreader top lip */}
      <rect x="1" y="2" width="26" height="4" rx="1.5"
        fill="currentColor" fillOpacity="0.25"
        stroke="currentColor" strokeWidth="0.5"/>

      {/* DRAM chips — 4 on front */}
      {[8, 22, 36, 50].map((y) => (
        <g key={`chip${y}`}>
          <rect x="4" y={y} width="20" height="10" rx="1"
            fill="currentColor" fillOpacity="0.2"
            stroke="currentColor" strokeWidth="0.7"/>
          {/* Chip internal grid */}
          <line x1="4" y1={y+3.5} x2="24" y2={y+3.5}
            stroke="currentColor" strokeWidth="0.35" strokeOpacity="0.5"/>
          <line x1="4" y1={y+7}   x2="24" y2={y+7}
            stroke="currentColor" strokeWidth="0.35" strokeOpacity="0.5"/>
          <line x1="14" y1={y}     x2="14" y2={y+10}
            stroke="currentColor" strokeWidth="0.35" strokeOpacity="0.5"/>
        </g>
      ))}

      {/* Gold contacts — with notch for orientation */}
      {/* Left group */}
      {[3, 5.5, 8, 10.5].map((x) => (
        <rect key={`cl${x}`} x={x} y="62" width="1.5" height="8" rx="0.5"
          fill="currentColor" fillOpacity="0.85"/>
      ))}
      {/* Right group (notch gap at ~13) */}
      {[15, 17.5, 20, 22.5, 25].map((x) => (
        <rect key={`cr${x}`} x={x} y="62" width="1.5" height="8" rx="0.5"
          fill="currentColor" fillOpacity="0.85"/>
      ))}
      {/* Notch cutout */}
      <rect x="12.5" y="63" width="2" height="7" rx="0.5"
        fill="currentColor" fillOpacity="0.06"
        stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  );
}

// ─── PSU ──────────────────────────────────────────────────────────────────────
// Caja + rejilla de ventilador circular + panel de conectores

export function PSUIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* Box body */}
      <rect x="2" y="8" width="60" height="48" rx="3"
        fill="currentColor" fillOpacity="0.1"
        stroke="currentColor" strokeWidth="1.4"/>

      {/* Fan grill — concentric rings */}
      <circle cx="22" cy="32" r="16" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.55" fill="none"/>
      <circle cx="22" cy="32" r="12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.55" fill="none"/>
      <circle cx="22" cy="32" r="8"  stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.55" fill="none"/>
      <circle cx="22" cy="32" r="4"  stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.55" fill="none"/>
      <circle cx="22" cy="32" r="1.5" fill="currentColor" fillOpacity="0.5"/>

      {/* Grill spokes × 8 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={22 + Math.cos(rad) * 3}  y1={32 + Math.sin(rad) * 3}
            x2={22 + Math.cos(rad) * 16} y2={32 + Math.sin(rad) * 16}
            stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4"/>
        );
      })}

      {/* Connector panel — right side */}
      <rect x="44" y="10" width="14" height="44" rx="2"
        fill="currentColor" fillOpacity="0.08"
        stroke="currentColor" strokeWidth="0.8"/>

      {/* Connector ports */}
      {[13, 21, 29, 37, 45].map((y) => (
        <rect key={y} x="46" y={y} width="10" height="5" rx="1"
          fill="currentColor" fillOpacity="0.28"
          stroke="currentColor" strokeWidth="0.5"/>
      ))}

      {/* Power switch indicator */}
      <circle cx="10" cy="55" r="3" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" fill="none"/>
      <line x1="10" y1="52" x2="10" y2="55" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7"/>
    </svg>
  );
}

// ─── Storage ──────────────────────────────────────────────────────────────────
// M.2 NVMe stick — conector dorado + chips NAND + controlador

export function StorageIcon({ size = 64, className = "", glow }: IconProps) {
  const glowClass = glow === "compatible"   ? "hw-glow-compatible"
                  : glow === "incompatible" ? "hw-glow-incompatible"
                  : "";
  return (
    <svg
      width={size} height={size * 0.3} viewBox="0 0 80 24"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={`${glowClass} ${className}`}
    >
      {/* PCB */}
      <rect x="1" y="1" width="74" height="22" rx="2"
        fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="1.2"/>

      {/* Controller chip */}
      <rect x="4" y="5" width="14" height="14" rx="1"
        fill="currentColor" fillOpacity="0.2"
        stroke="currentColor" strokeWidth="0.7"/>
      {/* Controller pin detail */}
      {[7,10,13].map((y) => (
        <line key={y} x1="4" y1={y} x2="18" y2={y}
          stroke="currentColor" strokeWidth="0.35" strokeOpacity="0.5"/>
      ))}

      {/* NAND chips × 4 */}
      {[22, 34, 46, 58].map((x) => (
        <rect key={x} x={x} y="5" width="10" height="14" rx="1"
          fill="currentColor" fillOpacity="0.2"
          stroke="currentColor" strokeWidth="0.6"/>
      ))}

      {/* M.2 connector contacts at right */}
      {[0,1,2,3,4,5,6,7].map((i) => (
        <rect key={i} x={73 + (i % 2 === 0 ? 0 : 1)} y={3 + i * 2.2}
          width="5" height="1.4" rx="0.3"
          fill="currentColor" fillOpacity="0.75"/>
      ))}
    </svg>
  );
}

// ─── Unified selector ─────────────────────────────────────────────────────────

export type HardwareCategory = "CPU" | "Motherboard" | "RAM" | "GPU" | "PSU" | "Storage";

export function HardwareSVG({
  category, size = 64, className = "", glow,
}: { category: string; size?: number; className?: string; glow?: "compatible" | "incompatible" | null }) {
  const props = { size, className, glow };
  switch (category) {
    case "CPU":         return <CPUIcon         {...props} />;
    case "Motherboard": return <MotherboardIcon {...props} />;
    case "GPU":         return <GPUIcon         {...props} />;
    case "RAM":         return <RAMIcon         {...props} />;
    case "PSU":         return <PSUIcon         {...props} />;
    case "Storage":     return <StorageIcon     {...props} />;
    default:            return <CPUIcon         {...props} />;
  }
}
