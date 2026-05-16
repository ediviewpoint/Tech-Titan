"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QUERY_CONFIG } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

// Patrón recomendado por TanStack para Next.js App Router:
// useState garantiza una instancia por componente (SSR-safe),
// evitando compartir estado entre requests en el servidor.
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient(QUERY_CONFIG));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
