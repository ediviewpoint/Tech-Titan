import {
  ProductsResponseSchema,
  ValidationResultSchema,
} from "./schemas";
import type { HardwareProduct, ValidationResult } from "@/types/hardware";

// Next.js rewrites /api/backend/* → http://localhost:9000/*  (ver next.config.js)
const BACKEND = "/api/backend";

const MOCK_PRICES: Record<string, number> = {
  // CPUs
  "AMD Ryzen 7 7800X3D":                  449,
  "Intel Core i9-13900K":                 559,
  // Motherboards
  "MSI MAG B650 TOMAHAWK":                199,
  "ASUS ROG STRIX Z790-E":                429,
  // RAM
  "G.Skill Flare X5 32GB DDR5-6000":      129,
  "Kingston Fury Beast 32GB DDR5-5200":   109,
  "Corsair Vengeance LPX 32GB DDR4-3200":  69,
  // GPU
  "NVIDIA GeForce RTX 4070 Super":        599,
  // PSU
  "Corsair RM850x 850W 80+ Gold":         149,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Respuesta no-JSON del servidor (${res.status}): ${text.slice(0, 80)}`);
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function fetchProducts(category: string): Promise<HardwareProduct[]> {
  const url = `${BACKEND}/store/pc-builder/products?category=${encodeURIComponent(category)}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await parseJson<{ error?: string }>(res);
    throw new Error(body.error ?? `Error ${res.status} al obtener productos`);
  }

  const raw = await parseJson<unknown>(res);

  // ── Zod: no renderizar si el contrato no se cumple ────────────────────
  const parsed = ProductsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(`Contrato de API violado en /products:\n${details}`);
  }

  return parsed.data.products.map((p) => ({
    ...p,
    price: MOCK_PRICES[p.name],
  }));
}

export async function fetchProductsByIds(ids: string[]): Promise<HardwareProduct[]> {
  if (ids.length === 0) return [];
  const url = `${BACKEND}/store/pc-builder/build?ids=${ids.join(",")}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await parseJson<{ error?: string }>(res);
    throw new Error(body.error ?? `Error ${res.status} al cargar build`);
  }

  const raw    = await parseJson<unknown>(res);
  const parsed = ProductsResponseSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Contrato de API violado en /build");

  return parsed.data.products.map((p) => ({ ...p, price: MOCK_PRICES[p.name] }));
}

export async function validateBuild(productIds: string[]): Promise<ValidationResult> {
  const res = await fetch(`${BACKEND}/store/pc-builder/validate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ product_ids: productIds }),
    cache:   "no-store",
  });

  if (!res.ok) {
    const body = await parseJson<{ error?: string }>(res);
    throw new Error(body.error ?? `Error ${res.status} al validar build`);
  }

  const raw = await parseJson<unknown>(res);

  // ── Zod: garantiza que el componente siempre recibe la forma esperada ─
  const parsed = ValidationResultSchema.safeParse(raw);
  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(`Contrato de API violado en /validate:\n${details}`);
  }

  return parsed.data;
}
