import {
  Cpu,
  CircuitBoard,
  MemoryStick,
  Gamepad2,
  Zap,
  HardDrive,
  type LucideProps,
} from "lucide-react";
import { ComponentCategory } from "@/types/hardware";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  [ComponentCategory.CPU]:         Cpu,
  [ComponentCategory.MOTHERBOARD]: CircuitBoard,
  [ComponentCategory.RAM]:         MemoryStick,
  [ComponentCategory.GPU]:         Gamepad2,
  [ComponentCategory.PSU]:         Zap,
  [ComponentCategory.STORAGE]:     HardDrive,
};

const GRADIENT_MAP: Record<string, string> = {
  [ComponentCategory.CPU]:         "from-cyan-500/25 via-blue-500/15 to-transparent",
  [ComponentCategory.MOTHERBOARD]: "from-violet-500/25 via-indigo-500/15 to-transparent",
  [ComponentCategory.RAM]:         "from-emerald-500/25 via-green-500/15 to-transparent",
  [ComponentCategory.GPU]:         "from-pink-500/25 via-purple-500/15 to-transparent",
  [ComponentCategory.PSU]:         "from-amber-500/25 via-orange-500/15 to-transparent",
  [ComponentCategory.STORAGE]:     "from-gray-400/20 via-gray-500/10 to-transparent",
};

interface HardwareIconProps {
  category:  string;
  size?:     number;
  className?: string;
}

export function HardwareIcon({ category, size = 24, className }: HardwareIconProps) {
  const Icon = ICON_MAP[category] ?? Cpu;
  return <Icon size={size} className={className} />;
}

export function getCategoryGradient(category: string): string {
  return GRADIENT_MAP[category] ?? "from-gray-500/20 to-transparent";
}
