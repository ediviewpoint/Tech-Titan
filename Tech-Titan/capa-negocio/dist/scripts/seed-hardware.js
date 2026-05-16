"use strict";

var _pg = require("pg");
var dotenv = _interopRequireWildcard(require("dotenv"));
var _hardware = require("../types/hardware");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
dotenv.config();
const DB_URL = process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";
// ─── Catálogo completo ────────────────────────────────────────────────────────
//
// BUNDLE A — AMD AM5 + DDR5 (100% compatible entre sí)
//   CPU_A   + MB_A + RAM_DDR5_A  →  compatible ✓
//
// BUNDLE B — Intel LGA1700 + DDR5 (100% compatible entre sí)
//   CPU_B   + MB_B + RAM_DDR5_B  →  compatible ✓
//
// COMPONENTES DE TEST (generan errores/warnings a propósito)
//   RAM_DDR4  →  incompatible con MB_A y MB_B (ambas son DDR5)
//   GPU       →  genera warning de PSU si no se agrega PSU
//   PSU       →  resuelve el warning de consumo
//
// CRUCES INTENCIONALMENTE INCOMPATIBLES:
//   CPU_A + MB_B  →  error de socket (AM5 vs LGA1700)
//   CPU_B + MB_A  →  error de socket (LGA1700 vs AM5)
//   RAM_DDR4 + MB_A → error de generación RAM (DDR4 en placa DDR5)

const HARDWARE_CATALOG = [
// ── CPUs ────────────────────────────────────────────────────────────────────

{
  name: "AMD Ryzen 7 7800X3D",
  category: _hardware.ComponentCategory.CPU,
  metadata: {
    socket_type: _hardware.SocketType.AM5,
    tdp_watts: 120
  }
}, {
  name: "Intel Core i9-13900K",
  category: _hardware.ComponentCategory.CPU,
  metadata: {
    socket_type: _hardware.SocketType.LGA1700,
    tdp_watts: 125
  }
},
// ── Motherboards ─────────────────────────────────────────────────────────────
// ram_generation habilitado: activa la RamCompatibilityRule del backend

{
  name: "MSI MAG B650 TOMAHAWK",
  category: _hardware.ComponentCategory.MOTHERBOARD,
  metadata: {
    socket_type: _hardware.SocketType.AM5,
    form_factor: _hardware.FormFactor.ATX,
    ram_generation: _hardware.RamGeneration.DDR5
  }
}, {
  name: "ASUS ROG STRIX Z790-E",
  category: _hardware.ComponentCategory.MOTHERBOARD,
  metadata: {
    socket_type: _hardware.SocketType.LGA1700,
    form_factor: _hardware.FormFactor.ATX,
    ram_generation: _hardware.RamGeneration.DDR5
  }
},
// ── RAM ──────────────────────────────────────────────────────────────────────

{
  name: "G.Skill Flare X5 32GB DDR5-6000",
  category: _hardware.ComponentCategory.RAM,
  metadata: {
    ram_generation: _hardware.RamGeneration.DDR5
  }
}, {
  // Compatible con MB_B también — DDR5 universal
  name: "Kingston Fury Beast 32GB DDR5-5200",
  category: _hardware.ComponentCategory.RAM,
  metadata: {
    ram_generation: _hardware.RamGeneration.DDR5
  }
}, {
  // Intencionalmente incompatible con MB_A y MB_B (genera RamCompatibilityRule error)
  name: "Corsair Vengeance LPX 32GB DDR4-3200",
  category: _hardware.ComponentCategory.RAM,
  metadata: {
    ram_generation: _hardware.RamGeneration.DDR4
  }
},
// ── GPU ──────────────────────────────────────────────────────────────────────
// Sin PSU en el build → PowerConsumptionRule genera warning de consumo

{
  name: "NVIDIA GeForce RTX 4070 Super",
  category: _hardware.ComponentCategory.GPU,
  metadata: {
    tdp_watts: 220
  }
},
// ── PSU ──────────────────────────────────────────────────────────────────────
// 850W resuelve el warning incluso en builds con i9-13900K + RTX 4070 Super (345W total)

{
  name: "Corsair RM850x 850W 80+ Gold",
  category: _hardware.ComponentCategory.PSU,
  metadata: {
    wattage_watts: 850
  }
}];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function validateConnection(client) {
  const result = await client.query("SELECT NOW() AS now");
  console.log(`[OK] PostgreSQL en línea: ${result.rows[0].now.toISOString()}`);
}
async function ensureSchema(client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS hardware_components (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(255) NOT NULL UNIQUE,
      category    VARCHAR(100) NOT NULL,
      metadata    JSONB        NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_category ON hardware_components (category)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_socket   ON hardware_components ((metadata->>'socket_type')) WHERE metadata->>'socket_type' IS NOT NULL`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_hardware_ram_gen  ON hardware_components ((metadata->>'ram_generation')) WHERE metadata->>'ram_generation' IS NOT NULL`);
  console.log("[OK] Esquema e índices listos");
}
async function upsertComponent(client, component) {
  // UPSERT: si el nombre ya existe, actualiza metadata (permite re-seed seguro)
  const result = await client.query(`INSERT INTO hardware_components (name, category, metadata)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE
       SET metadata   = EXCLUDED.metadata,
           updated_at = NOW()
     RETURNING id,
       CASE WHEN xmax = 0 THEN 'INSERT' ELSE 'UPDATE' END AS action`, [component.name, component.category, JSON.stringify(component.metadata)]);
  const {
    id,
    action
  } = result.rows[0];
  const icon = action === "INSERT" ? "[+]" : "[~]";
  console.log(`  ${icon} ${component.category.padEnd(12)} "${component.name}" → ${id}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = new _pg.Client({
    connectionString: DB_URL
  });
  try {
    console.log("Conectando a PostgreSQL...");
    await client.connect();
    await validateConnection(client);
    await ensureSchema(client);
    console.log(`\nInsertando ${HARDWARE_CATALOG.length} componentes:\n`);
    for (const component of HARDWARE_CATALOG) {
      await upsertComponent(client, component);
    }

    // ── Resumen post-seed ──────────────────────────────────────────────────
    const counts = await client.query(`SELECT category, COUNT(*)::text AS total
       FROM hardware_components
       GROUP BY category
       ORDER BY category`);
    console.log("\n── Resumen de la base de datos ──────────────────");
    for (const row of counts.rows) {
      console.log(`   ${row.category.padEnd(14)} ${row.total} componente(s)`);
    }
    const total = await client.query("SELECT COUNT(*)::text AS total FROM hardware_components");
    console.log(`   ${"TOTAL".padEnd(14)} ${total.rows[0].total} componentes`);
    console.log("─────────────────────────────────────────────────");
    console.log("\n[DONE] Seed completado exitosamente.\n");
    console.log("Bundles de test:");
    console.log("  Bundle AMD   → AMD Ryzen 7 7800X3D + MSI MAG B650 TOMAHAWK + G.Skill Flare X5 DDR5   ✓ COMPATIBLE");
    console.log("  Bundle Intel → Intel Core i9-13900K + ASUS ROG STRIX Z790-E + Kingston Fury Beast DDR5 ✓ COMPATIBLE");
    console.log("  Test error   → cualquier CPU + cualquier MB de otro socket                              ✗ SOCKET ERROR");
    console.log("  Test error   → Corsair Vengeance DDR4 + cualquier placa DDR5                           ✗ RAM ERROR");
    console.log("  Test warning → build sin PSU con GPU RTX 4070 Super (220W)                             ⚠ POWER WARNING");
  } catch (error) {
    console.error(`[ERROR] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}
main();