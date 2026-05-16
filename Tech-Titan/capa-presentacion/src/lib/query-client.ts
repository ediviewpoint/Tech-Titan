import { type QueryClientConfig } from "@tanstack/react-query";

// Configuración centralizada. Importada por QueryProvider para crear el cliente.
export const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime:           5 * 60 * 1000, // 5 min — catálogo de hardware no cambia frecuentemente
      gcTime:             10 * 60 * 1000, // 10 min garbage collection
      retry:              2,
      refetchOnWindowFocus: false,
    },
  },
};
