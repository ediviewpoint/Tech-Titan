import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Cpu } from "lucide-react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthButton } from "@/components/AuthButton";
import { ChatWrapper } from "@/components/ChatWrapper";
import { CurrencySelector } from "@/components/CurrencySelector";
import { SupportButton } from "@/components/SupportButton";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Tech Titan // PC Builder",
    template: "%s | Tech Titan",
  },
  description: "Arma el PC de tus sueños con validación de compatibilidad en tiempo real.",
  keywords: ["PC Builder", "hardware", "compatibilidad", "CPU", "GPU", "RAM"],
  openGraph: {
    title: "Tech Titan — PC Builder",
    description: "Selecciona componentes compatibles con validación en tiempo real.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(10,12,20,0.95)",
              border: "1px solid rgba(6,182,212,0.25)",
              color: "#e2e8f0",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "13px",
            },
          }}
        />
        <AuthProvider>
          {/* Navbar glassmorphism */}
          <header className="sticky top-0 z-50 glass border-b border-cyan-500/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center transition-all duration-200 group-hover:bg-cyan-500/25 group-hover:border-cyan-500/50">
                  <Cpu size={14} className="text-cyan-400" />
                </div>
                <span className="text-sm font-bold tracking-widest">
                  <span className="neon-text">TECH</span>
                  <span className="text-gray-600 mx-1 font-light">//</span>
                  <span className="text-white">TITAN</span>
                </span>
              </Link>

              <nav className="flex items-center gap-2">
                <Link
                  href="/pc-builder"
                  className="text-xs font-medium text-gray-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-500/5"
                >
                  PC Builder
                </Link>
                <CurrencySelector />
                <AuthButton />
              </nav>
            </div>
          </header>

          <QueryProvider>
            {children}
            {/* AI Chat flota en todas las páginas */}
            <ChatWrapper />
            {/* Botón de soporte / tickets — esquina inferior izquierda */}
            <SupportButton />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
