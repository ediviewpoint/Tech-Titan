// ─── Socket Types ─────────────────────────────────────────────────────────────
export enum SocketType {
  AM4    = "AM4",
  AM5    = "AM5",
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

// ─── Hardware Metadata (flexible JSONB) ───────────────────────────────────────
export interface HardwareMetadata {
  // CPU + Motherboard + Cooler
  socket_type?: SocketType;

  // Motherboard + Case
  form_factor?: FormFactor;

  // CPU + GPU + PSU (power budget)
  tdp_watts?: number;

  // Motherboard + RAM
  ram_generation?: RamGeneration;

  // PSU
  wattage_watts?: number;

  // RAM
  speed_mhz?: number;
  capacity_gb?: number;

  // GPU
  vram_gb?: number;

  // Storage
  interface_type?: StorageInterface;
  storage_capacity_gb?: number;

  // Case: lista de form factors de placa que admite
  supported_form_factors?: FormFactor[];

  // Cooler
  cooler_type?: CoolerType;
  supported_sockets?: SocketType[];
  tdp_rating?: number;
}

// ─── Cart Item (used by compatibility engine) ─────────────────────────────────
export interface CartItem {
  product_id: string;
  name:       string;
  category:   ComponentCategory;
  metadata:   HardwareMetadata;
}

// ─── Validation Result ────────────────────────────────────────────────────────
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
