"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyCode, ExchangeRate } from "@/types/hardware";

// ─── Rates por defecto (fallback offline) ────────────────────────────────────
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  PEN: 3.75,
  ARS: 920.0,
  CLP: 945.0,
  COP: 4150.0,
  BRL: 5.15,
  MXN: 17.8,
};

const DEFAULT_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  PEN: "S/",
  ARS: "$",
  CLP: "$",
  COP: "$",
  BRL: "R$",
  MXN: "$",
};

const TAX_DEFAULT = 18; // IGV Perú

// ─── State shape ──────────────────────────────────────────────────────────────

export interface CurrencyState {
  // Moneda seleccionada por el usuario
  selectedCurrency: CurrencyCode;

  // Tipos de cambio oficiales (cargados desde la API al iniciar)
  apiRates: Record<CurrencyCode, number>;

  // Overrides manuales del usuario (persisten entre sesiones)
  customRates: Partial<Record<CurrencyCode, number>>;

  // Símbolo de cada moneda
  symbols: Record<CurrencyCode, string>;

  // Precios con factura (incluyendo IGV/IVA)
  showWithTax: boolean;
  taxRate:     number; // porcentaje, ej: 18

  // Actions
  setCurrency:   (code: CurrencyCode) => void;
  setCustomRate: (code: CurrencyCode, rate: number) => void;
  resetRate:     (code: CurrencyCode) => void;
  setShowTax:    (v: boolean) => void;
  setTaxRate:    (pct: number) => void;
  loadApiRates:  (rates: ExchangeRate[]) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selectedCurrency: "PEN",
      apiRates:         { ...DEFAULT_RATES },
      customRates:      {},
      symbols:          { ...DEFAULT_SYMBOLS },
      showWithTax:      false,
      taxRate:          TAX_DEFAULT,

      setCurrency:   (code) => set({ selectedCurrency: code }),

      setCustomRate: (code, rate) =>
        set((s) => ({ customRates: { ...s.customRates, [code]: rate } })),

      resetRate: (code) =>
        set((s) => {
          const next = { ...s.customRates };
          delete next[code];
          return { customRates: next };
        }),

      setShowTax: (v)   => set({ showWithTax: v }),
      setTaxRate: (pct) => set({ taxRate: pct }),

      loadApiRates: (rates) => {
        const apiRates = { ...DEFAULT_RATES };
        const symbols  = { ...DEFAULT_SYMBOLS };
        for (const r of rates) {
          apiRates[r.currency_code]  = r.rate_to_usd;
          symbols[r.currency_code]   = r.symbol;
        }
        set({ apiRates, symbols });
      },
    }),
    {
      name:       "tech-titan-currency",
      partialize: (s) => ({
        selectedCurrency: s.selectedCurrency,
        customRates:      s.customRates,
        showWithTax:      s.showWithTax,
        taxRate:          s.taxRate,
      }),
    }
  )
);

// ─── Selector helpers ─────────────────────────────────────────────────────────

export function getEffectiveRate(state: CurrencyState, code?: CurrencyCode): number {
  const c = code ?? state.selectedCurrency;
  return state.customRates[c] ?? state.apiRates[c] ?? DEFAULT_RATES[c] ?? 1;
}

export function formatPrice(state: CurrencyState, priceUsd: number, code?: CurrencyCode): string {
  const c    = code ?? state.selectedCurrency;
  const rate = getEffectiveRate(state, c);
  const tax  = state.showWithTax ? 1 + state.taxRate / 100 : 1;
  const amt  = priceUsd * rate * tax;

  const sym  = state.symbols[c] ?? "$";

  // Formato según moneda
  if (c === "CLP" || c === "COP" || c === "ARS") {
    return `${sym} ${Math.round(amt).toLocaleString("es-LA")}`;
  }
  return `${sym} ${amt.toFixed(2)}`;
}
