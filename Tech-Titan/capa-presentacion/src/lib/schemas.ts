import { z } from "zod";
import {
  ComponentCategory, SocketType, FormFactor, RamGeneration,
  StorageInterface, CoolerType,
} from "@/types/hardware";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const SocketTypeSchema        = z.nativeEnum(SocketType);
export const FormFactorSchema        = z.nativeEnum(FormFactor);
export const RamGenerationSchema     = z.nativeEnum(RamGeneration);
export const ComponentCategorySchema = z.nativeEnum(ComponentCategory);
export const StorageInterfaceSchema  = z.nativeEnum(StorageInterface);
export const CoolerTypeSchema        = z.nativeEnum(CoolerType);

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const HardwareMetadataSchema = z.object({
  socket_type:            SocketTypeSchema.optional(),
  form_factor:            FormFactorSchema.optional(),
  tdp_watts:              z.number().nonnegative().optional(),
  ram_generation:         RamGenerationSchema.optional(),
  wattage_watts:          z.number().positive().optional(),
  speed_mhz:              z.number().positive().optional(),
  capacity_gb:            z.number().positive().optional(),
  vram_gb:                z.number().positive().optional(),
  interface_type:         StorageInterfaceSchema.optional(),
  storage_capacity_gb:    z.number().positive().optional(),
  supported_form_factors: z.array(FormFactorSchema).optional(),
  cooler_type:            CoolerTypeSchema.optional(),
  supported_sockets:      z.array(SocketTypeSchema).optional(),
  tdp_rating:             z.number().positive().optional(),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const HardwareProductSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1),
  category:  ComponentCategorySchema,
  price_usd: z.number().nonnegative(),
  metadata:  HardwareMetadataSchema,
});

// ─── API responses ────────────────────────────────────────────────────────────

export const ProductsResponseSchema = z.object({
  products: z.array(HardwareProductSchema),
});

export const ValidationResultSchema = z.object({
  compatible: z.boolean(),
  errors:     z.array(z.string()),
  warnings:   z.array(z.string()),
});

export const ExchangeRateSchema = z.object({
  currency_code: z.string(),
  currency_name: z.string(),
  rate_to_usd:   z.number().positive(),
  symbol:        z.string(),
  updated_at:    z.string(),
});

export const ExchangeRatesResponseSchema = z.object({
  rates: z.array(ExchangeRateSchema),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type HardwareProductDTO  = z.infer<typeof HardwareProductSchema>;
export type ValidationResultDTO = z.infer<typeof ValidationResultSchema>;
