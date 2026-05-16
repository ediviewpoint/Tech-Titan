import { z } from "zod";
import { ComponentCategory, SocketType, FormFactor, RamGeneration } from "@/types/hardware";

// ─── Enums (derivados directamente de los enums TypeScript) ───────────────────
// z.nativeEnum garantiza que Zod y TypeScript usan la misma fuente de verdad.
// Si el enum cambia en hardware.ts, los schemas fallarán automáticamente.

export const SocketTypeSchema        = z.nativeEnum(SocketType);
export const FormFactorSchema        = z.nativeEnum(FormFactor);
export const RamGenerationSchema     = z.nativeEnum(RamGeneration);
export const ComponentCategorySchema = z.nativeEnum(ComponentCategory);

// ─── Core schemas ─────────────────────────────────────────────────────────────

export const HardwareMetadataSchema = z.object({
  socket_type:    SocketTypeSchema.optional(),
  form_factor:    FormFactorSchema.optional(),
  tdp_watts:      z.number().nonnegative().optional(),
  ram_generation: RamGenerationSchema.optional(),
  wattage_watts:  z.number().positive().optional(),
});

export const HardwareProductSchema = z.object({
  id:       z.string().uuid(),
  name:     z.string().min(1),
  category: ComponentCategorySchema,
  metadata: HardwareMetadataSchema,
  price:    z.number().optional(),
});

// ─── API response schemas ─────────────────────────────────────────────────────
// El componente NO se renderiza si los datos no cumplen este contrato.

export const ProductsResponseSchema = z.object({
  products: z.array(HardwareProductSchema),
});

export const ValidationResultSchema = z.object({
  compatible: z.boolean(),
  errors:     z.array(z.string()),
  warnings:   z.array(z.string()),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type HardwareProductDTO  = z.infer<typeof HardwareProductSchema>;
export type ValidationResultDTO = z.infer<typeof ValidationResultSchema>;
