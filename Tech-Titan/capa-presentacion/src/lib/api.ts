import { ProductsResponseSchema, ValidationResultSchema, ExchangeRatesResponseSchema } from "./schemas";
import type { HardwareProduct, ValidationResult, ExchangeRate } from "@/types/hardware";

// Next.js rewrite: /api/backend/* → http://localhost:9000/*
const BACKEND = "/api/backend";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Respuesta no-JSON del servidor (${res.status}): ${text.slice(0, 100)}`);
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function fetchProducts(category: string): Promise<HardwareProduct[]> {
  const url = `${BACKEND}/store/pc-builder/products?category=${encodeURIComponent(category)}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await parseJson<{ error?: string }>(res);
    throw new Error(body.error ?? `Error ${res.status} al obtener productos`);
  }

  const raw    = await parseJson<unknown>(res);
  const parsed = ProductsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Contrato de API violado:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`);
  }

  return parsed.data.products;
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

  return parsed.data.products;
}

// ─── Validation ───────────────────────────────────────────────────────────────

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

  const raw    = await parseJson<unknown>(res);
  const parsed = ValidationResultSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Contrato de API violado en /validate");

  return parsed.data;
}

// ─── Currencies ───────────────────────────────────────────────────────────────

export async function fetchCurrencies(): Promise<ExchangeRate[]> {
  try {
    const res = await fetch(`${BACKEND}/store/currencies`, { cache: "no-store" });
    if (!res.ok) return [];
    const raw    = await parseJson<unknown>(res);
    const parsed = ExchangeRatesResponseSchema.safeParse(raw);
    if (!parsed.success) return [];
    return parsed.data.rates as ExchangeRate[];
  } catch {
    return [];
  }
}

export async function updateExchangeRate(
  code: string,
  rate: number,
  adminKey = ""
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND}/store/currencies/${code}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body:    JSON.stringify({ rate_to_usd: rate }),
    });
    if (!res.ok) {
      const body = await parseJson<{ error?: string }>(res);
      return { success: false, error: body.error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error de red" };
  }
}
