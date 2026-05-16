import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-space":   "#0d1117",
        "space-border": "rgba(255,255,255,0.08)",
        neon: {
          cyan:    "#00f2ff",
          purple:  "#7000ff",
          green:   "#00ff88",
          red:     "#ff3366",
          amber:   "#ffaa00",
          emerald: "#00e896",
        },
      },
      boxShadow: {
        glass:         "0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        "neon-sm":     "0 0 12px rgba(0,242,255,0.3)",
        "neon-md":     "0 0 24px rgba(0,242,255,0.4), 0 0 56px rgba(0,242,255,0.15)",
        "neon-sel":    "0 0 0 1px rgba(0,242,255,0.7), 0 0 28px rgba(0,242,255,0.3)",
        "neon-purple": "0 0 20px rgba(112,0,255,0.5), 0 0 50px rgba(112,0,255,0.2)",
        "glow-green":  "0 0 20px rgba(0,255,136,0.6), 0 0 45px rgba(0,255,136,0.25)",
        "glow-red":    "0 0 20px rgba(255,51,102,0.6), 0 0 45px rgba(255,51,102,0.25)",
        "glow-amber":  "0 0 14px rgba(255,170,0,0.4)",
      },
      animation: {
        "spin-slow":   "spin 1.4s linear infinite",
        "pulse-red":   "pulse-red 2.4s ease-in-out infinite",
        "pulse-green": "pulse-green 2.4s ease-in-out infinite",
        shimmer:       "shimmer 1.8s linear infinite",
        float:         "float 6s ease-in-out infinite",
        "fade-up":     "fade-up 0.5s ease-out both",
        "scan":        "scan 4s linear infinite",
        shake:         "shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(239,68,68,0.3), 0 0 0 1px rgba(239,68,68,0.4)" },
          "50%":       { boxShadow: "0 0 40px rgba(239,68,68,0.6), 0 0 60px rgba(239,68,68,0.2), 0 0 0 1px rgba(239,68,68,0.7)" },
        },
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(16,185,129,0.3), 0 0 0 1px rgba(16,185,129,0.3)" },
          "50%":       { boxShadow: "0 0 30px rgba(16,185,129,0.5), 0 0 0 1px rgba(16,185,129,0.6)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-10px)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%":      { transform: "translateX(-8px)" },
          "30%":      { transform: "translateX(7px)" },
          "45%":      { transform: "translateX(-6px)" },
          "60%":      { transform: "translateX(5px)" },
          "75%":      { transform: "translateX(-3px)" },
          "90%":      { transform: "translateX(2px)" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
      },
      backgroundImage: {
        "grid-dark":      "linear-gradient(rgba(0,242,255,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,242,255,0.04) 1px,transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer:          "linear-gradient(90deg, transparent 0%, rgba(0,242,255,0.06) 50%, transparent 100%)",
        "purple-fade":    "linear-gradient(135deg, rgba(112,0,255,0.15) 0%, transparent 60%)",
        "cyan-fade":      "linear-gradient(135deg, rgba(0,242,255,0.12) 0%, transparent 60%)",
      },
      backgroundSize: { grid: "40px 40px" },
    },
  },
  plugins: [],
};

export default config;
