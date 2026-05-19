import { Client } from "pg";
import * as dotenv from "dotenv";
import {
  HardwareMetadata,
  SocketType,
  FormFactor,
  RamGeneration,
  StorageInterface,
  CoolerType,
  ComponentCategory,
  CurrencyCode,
} from "../types/hardware";

dotenv.config();

const DB_URL =
  process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HardwareComponent {
  name:      string;
  category:  ComponentCategory;
  price_usd: number;
  metadata:  HardwareMetadata;
}

interface ExchangeRateSeed {
  currency_code: CurrencyCode;
  currency_name: string;
  rate_to_usd:   number;
  symbol:        string;
}

// ─── Tipos de Cambio Iniciales ────────────────────────────────────────────────

const EXCHANGE_RATES: ExchangeRateSeed[] = [
  { currency_code: "USD", currency_name: "Dólar Estadounidense", rate_to_usd: 1.0,    symbol: "$"   },
  { currency_code: "PEN", currency_name: "Sol Peruano",          rate_to_usd: 3.75,   symbol: "S/"  },
  { currency_code: "ARS", currency_name: "Peso Argentino",       rate_to_usd: 920.0,  symbol: "$"   },
  { currency_code: "CLP", currency_name: "Peso Chileno",         rate_to_usd: 945.0,  symbol: "$"   },
  { currency_code: "COP", currency_name: "Peso Colombiano",      rate_to_usd: 4150.0, symbol: "$"   },
  { currency_code: "BRL", currency_name: "Real Brasileño",       rate_to_usd: 5.15,   symbol: "R$"  },
  { currency_code: "MXN", currency_name: "Peso Mexicano",        rate_to_usd: 17.8,   symbol: "$"   },
  { currency_code: "BOB", currency_name: "Boliviano",            rate_to_usd: 6.91,   symbol: "Bs." },
];

// ─── Catálogo Completo ────────────────────────────────────────────────────────

const HARDWARE_CATALOG: HardwareComponent[] = [

  // ════════════════════════════════════════════════════════════════════════════
  //  CPUs — AMD (Socket AM4 / AM5)
  // ════════════════════════════════════════════════════════════════════════════

  { name: "AMD Ryzen 3 4100",       category: ComponentCategory.CPU, price_usd: 80,
    metadata: { socket_type: SocketType.AM4, tdp_watts: 65 } },
  { name: "AMD Ryzen 5 5600",       category: ComponentCategory.CPU, price_usd: 120,
    metadata: { socket_type: SocketType.AM4, tdp_watts: 65 } },
  { name: "AMD Ryzen 5 5600X",      category: ComponentCategory.CPU, price_usd: 145,
    metadata: { socket_type: SocketType.AM4, tdp_watts: 65 } },
  { name: "AMD Ryzen 7 5700X",      category: ComponentCategory.CPU, price_usd: 185,
    metadata: { socket_type: SocketType.AM4, tdp_watts: 65 } },
  { name: "AMD Ryzen 5 7600",       category: ComponentCategory.CPU, price_usd: 185,
    metadata: { socket_type: SocketType.AM5, tdp_watts: 65 } },
  { name: "AMD Ryzen 7 7700X",      category: ComponentCategory.CPU, price_usd: 270,
    metadata: { socket_type: SocketType.AM5, tdp_watts: 105 } },
  { name: "AMD Ryzen 7 7800X3D",    category: ComponentCategory.CPU, price_usd: 380,
    metadata: { socket_type: SocketType.AM5, tdp_watts: 120 } },
  { name: "AMD Ryzen 9 7900X",      category: ComponentCategory.CPU, price_usd: 420,
    metadata: { socket_type: SocketType.AM5, tdp_watts: 170 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  CPUs — Intel (Socket LGA1700)
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Intel Core i3-12100F",  category: ComponentCategory.CPU, price_usd: 80,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 58 } },
  { name: "Intel Core i5-12400F",  category: ComponentCategory.CPU, price_usd: 130,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 65 } },
  { name: "Intel Core i5-13400F",  category: ComponentCategory.CPU, price_usd: 155,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 65 } },
  { name: "Intel Core i5-13600K",  category: ComponentCategory.CPU, price_usd: 240,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 125 } },
  { name: "Intel Core i7-13700K",  category: ComponentCategory.CPU, price_usd: 350,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 125 } },
  { name: "Intel Core i9-13900K",  category: ComponentCategory.CPU, price_usd: 480,
    metadata: { socket_type: SocketType.LGA1700, tdp_watts: 125 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Motherboards — AM4 DDR4
  // ════════════════════════════════════════════════════════════════════════════

  { name: "MSI A320M PRO-VH",                     category: ComponentCategory.MOTHERBOARD, price_usd: 70,
    metadata: { socket_type: SocketType.AM4, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR4 } },
  { name: "ASUS TUF Gaming B450M-Plus WiFi",       category: ComponentCategory.MOTHERBOARD, price_usd: 98,
    metadata: { socket_type: SocketType.AM4, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR4 } },
  { name: "MSI MAG B550M MORTAR WiFi",             category: ComponentCategory.MOTHERBOARD, price_usd: 125,
    metadata: { socket_type: SocketType.AM4, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR4 } },
  { name: "ASUS ROG STRIX B550-F Gaming WiFi II",  category: ComponentCategory.MOTHERBOARD, price_usd: 178,
    metadata: { socket_type: SocketType.AM4, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR4 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Motherboards — AM5 DDR5
  // ════════════════════════════════════════════════════════════════════════════

  { name: "ASRock B650M PRO RS WiFi",              category: ComponentCategory.MOTHERBOARD, price_usd: 128,
    metadata: { socket_type: SocketType.AM5, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR5 } },
  { name: "MSI MAG B650 TOMAHAWK WiFi",            category: ComponentCategory.MOTHERBOARD, price_usd: 185,
    metadata: { socket_type: SocketType.AM5, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR5 } },
  { name: "ASUS ROG STRIX X670E-F Gaming WiFi",    category: ComponentCategory.MOTHERBOARD, price_usd: 325,
    metadata: { socket_type: SocketType.AM5, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR5 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Motherboards — LGA1700 DDR4
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Gigabyte H610M S2H DDR4",               category: ComponentCategory.MOTHERBOARD, price_usd: 75,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR4 } },
  { name: "ASRock B660M Pro RS DDR4",              category: ComponentCategory.MOTHERBOARD, price_usd: 112,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR4 } },
  { name: "MSI PRO Z690-A DDR4",                  category: ComponentCategory.MOTHERBOARD, price_usd: 178,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR4 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Motherboards — LGA1700 DDR5
  // ════════════════════════════════════════════════════════════════════════════

  { name: "MSI PRO B760M-A WiFi DDR5",             category: ComponentCategory.MOTHERBOARD, price_usd: 132,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.MATX, ram_generation: RamGeneration.DDR5 } },
  { name: "ASUS TUF Gaming Z790-Plus WiFi D5",     category: ComponentCategory.MOTHERBOARD, price_usd: 228,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR5 } },
  { name: "ASUS ROG STRIX Z790-E Gaming WiFi II",  category: ComponentCategory.MOTHERBOARD, price_usd: 390,
    metadata: { socket_type: SocketType.LGA1700, form_factor: FormFactor.ATX,  ram_generation: RamGeneration.DDR5 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  RAM — DDR4
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Kingston ValueRAM 8GB DDR4-3200",          category: ComponentCategory.RAM, price_usd: 22,
    metadata: { ram_generation: RamGeneration.DDR4, capacity_gb: 8,  speed_mhz: 3200 } },
  { name: "G.Skill Ripjaws V 16GB DDR4-3200",         category: ComponentCategory.RAM, price_usd: 42,
    metadata: { ram_generation: RamGeneration.DDR4, capacity_gb: 16, speed_mhz: 3200 } },
  { name: "Corsair Vengeance LPX 16GB DDR4-3600",     category: ComponentCategory.RAM, price_usd: 52,
    metadata: { ram_generation: RamGeneration.DDR4, capacity_gb: 16, speed_mhz: 3600 } },
  { name: "Corsair Vengeance LPX 32GB DDR4-3200",     category: ComponentCategory.RAM, price_usd: 78,
    metadata: { ram_generation: RamGeneration.DDR4, capacity_gb: 32, speed_mhz: 3200 } },
  { name: "G.Skill Trident Z 32GB DDR4-3600",         category: ComponentCategory.RAM, price_usd: 95,
    metadata: { ram_generation: RamGeneration.DDR4, capacity_gb: 32, speed_mhz: 3600 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  RAM — DDR5
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Kingston Fury Beast 16GB DDR5-5200",        category: ComponentCategory.RAM, price_usd: 58,
    metadata: { ram_generation: RamGeneration.DDR5, capacity_gb: 16, speed_mhz: 5200 } },
  { name: "G.Skill Ripjaws S5 32GB DDR5-5600",         category: ComponentCategory.RAM, price_usd: 92,
    metadata: { ram_generation: RamGeneration.DDR5, capacity_gb: 32, speed_mhz: 5600 } },
  { name: "Corsair Vengeance 32GB DDR5-5600",           category: ComponentCategory.RAM, price_usd: 98,
    metadata: { ram_generation: RamGeneration.DDR5, capacity_gb: 32, speed_mhz: 5600 } },
  { name: "G.Skill Flare X5 32GB DDR5-6000",           category: ComponentCategory.RAM, price_usd: 115,
    metadata: { ram_generation: RamGeneration.DDR5, capacity_gb: 32, speed_mhz: 6000 } },
  { name: "Kingston Fury Beast 64GB DDR5-5600",         category: ComponentCategory.RAM, price_usd: 185,
    metadata: { ram_generation: RamGeneration.DDR5, capacity_gb: 64, speed_mhz: 5600 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  GPUs — NVIDIA
  // ════════════════════════════════════════════════════════════════════════════

  { name: "MSI GeForce GTX 1650 Ventus XS 4G OC",    category: ComponentCategory.GPU, price_usd: 135,
    metadata: { tdp_watts: 75,  vram_gb: 4  } },
  { name: "ASUS DUAL GeForce RTX 3060 12GB",          category: ComponentCategory.GPU, price_usd: 285,
    metadata: { tdp_watts: 170, vram_gb: 12 } },
  { name: "MSI Gaming X RTX 3060 Ti 8GB",             category: ComponentCategory.GPU, price_usd: 355,
    metadata: { tdp_watts: 200, vram_gb: 8  } },
  { name: "ASUS DUAL GeForce RTX 4060 8GB",           category: ComponentCategory.GPU, price_usd: 305,
    metadata: { tdp_watts: 115, vram_gb: 8  } },
  { name: "MSI Gaming X Slim RTX 4070 12GB",          category: ComponentCategory.GPU, price_usd: 525,
    metadata: { tdp_watts: 200, vram_gb: 12 } },
  { name: "ASUS TUF Gaming RTX 4070 Super 12GB",      category: ComponentCategory.GPU, price_usd: 565,
    metadata: { tdp_watts: 220, vram_gb: 12 } },
  { name: "ASUS TUF Gaming RTX 4080 Super 16GB",      category: ComponentCategory.GPU, price_usd: 960,
    metadata: { tdp_watts: 320, vram_gb: 16 } },
  { name: "ASUS ROG STRIX RTX 4090 24GB OC",          category: ComponentCategory.GPU, price_usd: 1650,
    metadata: { tdp_watts: 450, vram_gb: 24 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  GPUs — AMD
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Sapphire Pulse Radeon RX 6600 8GB",        category: ComponentCategory.GPU, price_usd: 205,
    metadata: { tdp_watts: 132, vram_gb: 8  } },
  { name: "XFX Speedster QICK 309 RX 6700 XT 12GB",  category: ComponentCategory.GPU, price_usd: 325,
    metadata: { tdp_watts: 230, vram_gb: 12 } },
  { name: "Sapphire Pulse Radeon RX 7600 8GB",        category: ComponentCategory.GPU, price_usd: 245,
    metadata: { tdp_watts: 165, vram_gb: 8  } },
  { name: "PowerColor Fighter RX 7700 XT 12GB",       category: ComponentCategory.GPU, price_usd: 385,
    metadata: { tdp_watts: 245, vram_gb: 12 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Storage — SSD SATA
  // ════════════════════════════════════════════════════════════════════════════

  { name: "WD Green 480GB SSD SATA",                  category: ComponentCategory.STORAGE, price_usd: 42,
    metadata: { interface_type: StorageInterface.SATA, storage_capacity_gb: 480 } },
  { name: "Samsung 870 EVO 1TB SSD SATA",             category: ComponentCategory.STORAGE, price_usd: 85,
    metadata: { interface_type: StorageInterface.SATA, storage_capacity_gb: 1000 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Storage — NVMe PCIe 3.0
  // ════════════════════════════════════════════════════════════════════════════

  { name: "WD Green SN350 500GB NVMe PCIe 3.0",       category: ComponentCategory.STORAGE, price_usd: 48,
    metadata: { interface_type: StorageInterface.NVMe_PCIe3, storage_capacity_gb: 500 } },
  { name: "Kingston NV3 1TB NVMe PCIe 3.0",           category: ComponentCategory.STORAGE, price_usd: 62,
    metadata: { interface_type: StorageInterface.NVMe_PCIe3, storage_capacity_gb: 1000 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Storage — NVMe PCIe 4.0
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Kingston NV2 1TB NVMe PCIe 4.0",           category: ComponentCategory.STORAGE, price_usd: 68,
    metadata: { interface_type: StorageInterface.NVMe_PCIe4, storage_capacity_gb: 1000 } },
  { name: "WD Blue SN580 1TB NVMe PCIe 4.0",          category: ComponentCategory.STORAGE, price_usd: 78,
    metadata: { interface_type: StorageInterface.NVMe_PCIe4, storage_capacity_gb: 1000 } },
  { name: "Samsung 980 Pro 1TB NVMe PCIe 4.0",        category: ComponentCategory.STORAGE, price_usd: 105,
    metadata: { interface_type: StorageInterface.NVMe_PCIe4, storage_capacity_gb: 1000 } },
  { name: "WD Black SN850X 2TB NVMe PCIe 4.0",        category: ComponentCategory.STORAGE, price_usd: 165,
    metadata: { interface_type: StorageInterface.NVMe_PCIe4, storage_capacity_gb: 2000 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Storage — HDD
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Seagate Barracuda 2TB HDD 7200rpm",         category: ComponentCategory.STORAGE, price_usd: 58,
    metadata: { interface_type: StorageInterface.HDD, storage_capacity_gb: 2000 } },
  { name: "Seagate Barracuda 4TB HDD 7200rpm",         category: ComponentCategory.STORAGE, price_usd: 88,
    metadata: { interface_type: StorageInterface.HDD, storage_capacity_gb: 4000 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  PSUs
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Corsair CV550 550W 80+ Bronze",             category: ComponentCategory.PSU, price_usd: 52,
    metadata: { wattage_watts: 550, tdp_watts: 550 } },
  { name: "EVGA 600 BR 600W 80+ Bronze",               category: ComponentCategory.PSU, price_usd: 58,
    metadata: { wattage_watts: 600, tdp_watts: 600 } },
  { name: "Corsair CX650F RGB 650W 80+ Bronze",        category: ComponentCategory.PSU, price_usd: 75,
    metadata: { wattage_watts: 650, tdp_watts: 650 } },
  { name: "EVGA SuperNOVA 650 G6 650W 80+ Gold",       category: ComponentCategory.PSU, price_usd: 88,
    metadata: { wattage_watts: 650, tdp_watts: 650 } },
  { name: "Corsair RM750x 750W 80+ Gold",              category: ComponentCategory.PSU, price_usd: 115,
    metadata: { wattage_watts: 750, tdp_watts: 750 } },
  { name: "Corsair RM850x 850W 80+ Gold",              category: ComponentCategory.PSU, price_usd: 135,
    metadata: { wattage_watts: 850, tdp_watts: 850 } },
  { name: "Corsair HX1000 1000W 80+ Platinum",         category: ComponentCategory.PSU, price_usd: 205,
    metadata: { wattage_watts: 1000, tdp_watts: 1000 } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Cases / Gabinetes
  // ════════════════════════════════════════════════════════════════════════════

  { name: "Cooler Master MasterBox Q300L",             category: ComponentCategory.CASE, price_usd: 55,
    metadata: { form_factor: FormFactor.MATX, supported_form_factors: [FormFactor.MATX, FormFactor.ITX] } },
  { name: "Corsair 2000D RGB Airflow Mini-ITX",        category: ComponentCategory.CASE, price_usd: 78,
    metadata: { form_factor: FormFactor.ITX,  supported_form_factors: [FormFactor.ITX] } },
  { name: "Corsair 4000D Airflow ATX Mid-Tower",       category: ComponentCategory.CASE, price_usd: 95,
    metadata: { form_factor: FormFactor.ATX,  supported_form_factors: [FormFactor.ATX, FormFactor.MATX, FormFactor.ITX] } },
  { name: "NZXT H5 Flow ATX Mid-Tower",                category: ComponentCategory.CASE, price_usd: 108,
    metadata: { form_factor: FormFactor.ATX,  supported_form_factors: [FormFactor.ATX, FormFactor.MATX, FormFactor.ITX] } },
  { name: "Lian Li LANCOOL 216 RGB",                   category: ComponentCategory.CASE, price_usd: 118,
    metadata: { form_factor: FormFactor.ATX,  supported_form_factors: [FormFactor.ATX, FormFactor.MATX, FormFactor.ITX] } },
  { name: "Fractal Design Meshify 2 Compact",          category: ComponentCategory.CASE, price_usd: 128,
    metadata: { form_factor: FormFactor.ATX,  supported_form_factors: [FormFactor.ATX, FormFactor.MATX, FormFactor.ITX] } },

  // ════════════════════════════════════════════════════════════════════════════
  //  Coolers / Refrigeración
  // ════════════════════════════════════════════════════════════════════════════

  { name: "AMD Wraith Stealth (Bundle AM4)",            category: ComponentCategory.COOLER, price_usd: 0,
    metadata: { cooler_type: CoolerType.Stock, supported_sockets: [SocketType.AM4], tdp_rating: 65 } },
  { name: "Intel Box Cooler (Bundle LGA1700)",          category: ComponentCategory.COOLER, price_usd: 0,
    metadata: { cooler_type: CoolerType.Stock, supported_sockets: [SocketType.LGA1700], tdp_rating: 65 } },
  { name: "ID-COOLING SE-224-XT ARGB",                  category: ComponentCategory.COOLER, price_usd: 35,
    metadata: { cooler_type: CoolerType.Air, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 180 } },
  { name: "Cooler Master Hyper 212 Black Edition",      category: ComponentCategory.COOLER, price_usd: 42,
    metadata: { cooler_type: CoolerType.Air, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 180 } },
  { name: "DeepCool AK400 Zero Dark Plus",              category: ComponentCategory.COOLER, price_usd: 48,
    metadata: { cooler_type: CoolerType.Air, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 220 } },
  { name: "DeepCool LT520 240mm AIO",                   category: ComponentCategory.COOLER, price_usd: 85,
    metadata: { cooler_type: CoolerType.AIO_240, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 280 } },
  { name: "Corsair H100i RGB Elite 240mm AIO",          category: ComponentCategory.COOLER, price_usd: 118,
    metadata: { cooler_type: CoolerType.AIO_240, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 300 } },
  { name: "NZXT Kraken X63 280mm AIO",                  category: ComponentCategory.COOLER, price_usd: 142,
    metadata: { cooler_type: CoolerType.AIO_280, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 350 } },
  { name: "Corsair H150i Elite Capellix 360mm AIO",     category: ComponentCategory.COOLER, price_usd: 168,
    metadata: { cooler_type: CoolerType.AIO_360, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700, SocketType.LGA1200], tdp_rating: 420 } },
];

// ─── Schema helpers ───────────────────────────────────────────────────────────

async function ensureSchema(client: Client): Promise<void> {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS hardware_components (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(255) NOT NULL UNIQUE,
      category    VARCHAR(100) NOT NULL,
      price_usd   DECIMAL(10,2) NOT NULL DEFAULT 0,
      metadata    JSONB        NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Migración: agregar price_usd si no existe (para bases de datos antiguas)
  await client.query(`
    ALTER TABLE hardware_components
    ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) NOT NULL DEFAULT 0
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      currency_code VARCHAR(10)    PRIMARY KEY,
      currency_name VARCHAR(80)    NOT NULL,
      rate_to_usd   DECIMAL(20,6)  NOT NULL DEFAULT 1.0,
      symbol        VARCHAR(10)    NOT NULL DEFAULT '$',
      updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_builds (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     VARCHAR(255) NOT NULL,
      user_email  VARCHAR(255) NOT NULL,
      build_name  VARCHAR(100) NOT NULL,
      components  JSONB        NOT NULL DEFAULT '[]',
      total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_tdp   INTEGER      NOT NULL DEFAULT 0,
      is_valid    BOOLEAN      NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Índices
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_category ON hardware_components (category)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_price    ON hardware_components (price_usd)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_socket   ON hardware_components ((metadata->>'socket_type'))  WHERE metadata->>'socket_type'  IS NOT NULL`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_ram_gen  ON hardware_components ((metadata->>'ram_generation')) WHERE metadata->>'ram_generation' IS NOT NULL`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_user_builds_uid   ON user_builds (user_id)`);

  console.log("[OK] Esquema e índices listos");
}

async function upsertComponent(client: Client, c: HardwareComponent): Promise<void> {
  const result = await client.query<{ id: string; action: string }>(
    `INSERT INTO hardware_components (name, category, price_usd, metadata)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO UPDATE
       SET price_usd  = EXCLUDED.price_usd,
           metadata   = EXCLUDED.metadata,
           updated_at = NOW()
     RETURNING id,
       CASE WHEN xmax = 0 THEN 'INSERT' ELSE 'UPDATE' END AS action`,
    [c.name, c.category, c.price_usd, JSON.stringify(c.metadata)]
  );
  const { id, action } = result.rows[0]!;
  const icon = action === "INSERT" ? "[+]" : "[~]";
  console.log(`  ${icon} ${c.category.padEnd(12)} $${String(c.price_usd).padStart(6)}  "${c.name}" → ${id}`);
}

async function upsertExchangeRate(client: Client, r: ExchangeRateSeed): Promise<void> {
  await client.query(
    `INSERT INTO exchange_rates (currency_code, currency_name, rate_to_usd, symbol)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (currency_code) DO NOTHING`,
    [r.currency_code, r.currency_name, r.rate_to_usd, r.symbol]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const client = new Client({ connectionString: DB_URL });

  try {
    console.log("\n🔌 Conectando a PostgreSQL...");
    await client.connect();
    const { rows } = await client.query<{ now: Date }>("SELECT NOW() AS now");
    console.log(`[OK] PostgreSQL en línea: ${rows[0]!.now.toISOString()}`);

    await ensureSchema(client);

    // Tipos de cambio
    console.log("\n💱 Insertando tipos de cambio...");
    for (const rate of EXCHANGE_RATES) {
      await upsertExchangeRate(client, rate);
      console.log(`  [OK] ${rate.currency_code} (1 USD = ${rate.rate_to_usd} ${rate.currency_code})`);
    }

    // Productos
    console.log(`\n📦 Insertando ${HARDWARE_CATALOG.length} componentes:\n`);
    for (const component of HARDWARE_CATALOG) {
      await upsertComponent(client, component);
    }

    // Resumen por categoría
    const counts = await client.query<{ category: string; total: string; avg_price: string }>(
      `SELECT category, COUNT(*)::text AS total, ROUND(AVG(price_usd), 2)::text AS avg_price
       FROM hardware_components GROUP BY category ORDER BY category`
    );
    const total = await client.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM hardware_components");

    console.log("\n── Resumen ─────────────────────────────────────────────");
    for (const row of counts.rows) {
      console.log(`   ${row.category.padEnd(14)} ${row.total.padStart(3)} productos   avg $${row.avg_price}`);
    }
    console.log(`   ${"TOTAL".padEnd(14)} ${total.rows[0]!.total} componentes`);
    console.log("────────────────────────────────────────────────────────\n");
    console.log("[DONE] Seed completado exitosamente.\n");

  } catch (error: unknown) {
    console.error(`[ERROR] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
