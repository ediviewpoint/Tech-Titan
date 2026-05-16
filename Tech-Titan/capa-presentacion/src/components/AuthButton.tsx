"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { User, LogOut, LogIn, Loader2 } from "lucide-react";
import { Skeleton } from "./ui/Skeleton";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="w-7 h-7 rounded-full" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "Usuario"}
            width={28}
            height={28}
            className="rounded-full border border-cyan-500/30"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <User size={14} className="text-cyan-400" />
          </div>
        )}
        <span className="hidden md:block text-xs text-gray-400 max-w-[100px] truncate">
          {session.user.name ?? session.user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-red-400 transition-colors p-1"
          title="Cerrar sesión"
        >
          <LogOut size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="btn-ghost py-1.5 text-xs"
    >
      <LogIn size={13} />
      <span className="hidden sm:block">Iniciar Sesión</span>
    </button>
  );
}
