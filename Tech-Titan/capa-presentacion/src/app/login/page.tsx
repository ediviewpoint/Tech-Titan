import type { Metadata } from "next";
import { GitBranch, Globe, Shield } from "lucide-react";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Tech Titan",
  description: "Accede a tu cuenta para guardar y gestionar tus builds de PC.",
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="glass-card max-w-sm w-full p-8 space-y-7 text-center">
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
          <Shield size={28} className="text-cyan-400" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold gradient-text-cyan">Iniciar Sesión</h1>
          <p className="text-sm text-gray-400">
            Accede para guardar y gestionar tus builds de PC personalizados.
          </p>
        </div>

        {/* Providers */}
        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/pc-builder" });
            }}
          >
            <button
              type="submit"
              className="w-full glass-card-hover flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-xl"
            >
              <GitBranch size={18} />
              Continuar con GitHub
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/pc-builder" });
            }}
          >
            <button
              type="submit"
              className="w-full glass-card-hover flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-xl"
            >
              <Globe size={18} />
              Continuar con Google
            </button>
          </form>
        </div>

        <p className="text-[10px] text-gray-600 leading-relaxed">
          Configura las credenciales OAuth en <code className="text-gray-500">.env.local</code> para activar el login. Ver <code className="text-gray-500">docs/SCALABILITY_V2.md</code>.
        </p>
      </div>
    </main>
  );
}
