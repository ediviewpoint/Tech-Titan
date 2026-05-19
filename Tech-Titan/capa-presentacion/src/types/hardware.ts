// ─── Socket Types ─────────────────────────────────────────────────────────────
export enum SocketType {
  AM4     = "AM4",
  AM5     = "AM5",
  LGA1700 = "LGA1700",
  LGA1200 = "LGA1200",
}

// ─── Form Factors ─────────────────────────────────────────────────────────────
export enum FormFactor {
  ATX  = "ATX",
  MATX = "MATX",
  ITX  = "ITX",
}

// ─── RAM Generation ───────────────────────────────────────────────────────────
export enum RamGeneration {
  DDR4 = "DDR4",
  DDR5 = "DDR5",
}

// ─── Storage Interface ────────────────────────────────────────────────────────
export enum StorageInterface {
  NVMe_PCIe4 = "NVMe_PCIe4",
  NVMe_PCIe3 = "NVMe_PCIe3",
  SATA       = "SATA",
  HDD        = "HDD",
}

// ─── Cooler Type ──────────────────────────────────────────────────────────────
export enum CoolerType {
  Stock   = "Stock",
  Air     = "Air",
  AIO_120 = "AIO_120",
  AIO_240 = "AIO_240",
  AIO_280 = "AIO_280",
  AIO_360 = "AIO_360",
}

// ─── Component Categories ─────────────────────────────────────────────────────
export enum ComponentCategory {
  CPU         = "CPU",
  MOTHERBOARD = "Motherboard",
  RAM         = "RAM",
  GPU         = "GPU",
  PSU         = "PSU",
  STORAGE     = "Storage",
  CASE        = "Case",
  COOLER      = "Cooler",
}

// ─── Hardware Metadata ────────────────────────────────────────────────────────
export interface HardwareMetadata {
  socket_type?:            SocketType;
  form_factor?:            FormFactor;
  tdp_watts?:              number;
  ram_generation?:         RamGeneration;
  wattage_watts?:          number;
  speed_mhz?:              number;
  capacity_gb?:            number;
  vram_gb?:                number;
  interface_type?:         StorageInterface;
  storage_capacity_gb?:    number;
  supported_form_factors?: FormFactor[];
  cooler_type?:            CoolerType;
  supported_sockets?:      SocketType[];
  tdp_rating?:             number;
}

// ─── Product (from API) ───────────────────────────────────────────────────────
export interface HardwareProduct {
  id:           string;
  name:         string;
  category:     ComponentCategory;
  price_usd:    number;
  metadata:     HardwareMetadata;
  svg_key?:     string;
  stock:        number;
  description?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  product_id?: string;
  name:        string;
  category:    string;
  price_usd:   number;
  quantity:    number;
  svg_key?:    string;
  metadata?:   HardwareMetadata;
}

export interface Order {
  id:            string;
  user_email?:   string;
  status:        "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  currency:      CurrencyCode;
  total_usd:     number;
  total_local?:  number;
  exchange_rate?: number;
  notes?:        string;
  items:         OrderItem[];
  created_at:    string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
export interface ValidationResult {
  compatible: boolean;
  errors:     string[];
  warnings:   string[];
}

// ─── Currency ─────────────────────────────────────────────────────────────────
export type CurrencyCode = "USD" | "PEN" | "ARS" | "CLP" | "COP" | "BRL" | "MXN" | "BOB";

export interface ExchangeRate {
  currency_code: CurrencyCode;
  currency_name: string;
  rate_to_usd:   number;
  symbol:        string;
  updated_at:    string;
}

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "USD — Dólar",
  PEN: "PEN — Sol",
  ARS: "ARS — Peso Arg.",
  CLP: "CLP — Peso Chil.",
  COP: "COP — Peso Col.",
  BRL: "BRL — Real",
  MXN: "MXN — Peso Mex.",
  BOB: "BOB — Boliviano",
};
