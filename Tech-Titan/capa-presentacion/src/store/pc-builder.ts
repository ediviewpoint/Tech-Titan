import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HardwareProduct } from "@/types/hardware";
import { ComponentCategory } from "@/types/hardware";

// ─── State shape ──────────────────────────────────────────────────────────────

export interface PCBuilderState {
  selected:    Partial<Record<ComponentCategory, HardwareProduct>>;
  currentStep: number;

  // Actions
  selectComponent:  (product: HardwareProduct) => void;
  removeComponent:  (category: ComponentCategory) => void;
  setStep:          (step: number) => void;
  reset:            () => void;
  loadComponents:   (products: HardwareProduct[]) => void;
}

const INITIAL: Pick<PCBuilderState, "selected" | "currentStep"> = {
  selected:    {},
  currentStep: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePCBuilderStore = create<PCBuilderState>()(
  persist(
    (set) => ({
      ...INITIAL,

      selectComponent: (product) =>
        set((state) => ({
          selected: { ...state.selected, [product.category]: product },
        })),

      removeComponent: (category) =>
        set((state) => {
          const next = { ...state.selected };
          delete next[category];
          return { selected: next };
        }),

      setStep: (step) => set({ currentStep: step }),

      reset: () => set(INITIAL),

      loadComponents: (products) =>
        set(() => {
          const selected: Partial<Record<ComponentCategory, HardwareProduct>> = {};
          for (const p of products) {
            selected[p.category as ComponentCategory] = p;
          }
          return { selected };
        }),
    }),
    {
      name:            "tech-titan-pc-builder",    // clave en localStorage
      skipHydration:   true,                        // evita mismatch SSR/cliente
      partialize: (state) => ({                     // solo persistir datos, no actions
        selected:    state.selected,
        currentStep: state.currentStep,
      }),
    }
  )
);

// ─── Selector helpers (memoización sin re-renders innecesarios) ───────────────

export const selectSelectedProducts = (state: PCBuilderState) =>
  Object.values(state.selected).filter(
    (p): p is HardwareProduct => p !== undefined
  );

export const selectTotalPrice = (state: PCBuilderState) =>
  selectSelectedProducts(state).reduce((sum, p) => sum + (p.price ?? 0), 0);
