/**
 * Runner de migraciones — ejecuta todas en orden cronológico.
 *
 * Uso:
 *   npm run migrate
 *   npm run migrate:down   (revierte la última)
 */
import "dotenv/config";
import path from "path";
import pool from "../lib/db";
import logger from "../lib/logger";
import { up as up1, down as down1 } from "../migrations/1716000000000-CreateHardwareComponents";
import { up as up2, down as down2 } from "../migrations/1716000001000-AddExtensions";
import { up as up3, down as down3 } from "../migrations/1716000002000-ExtendImageField";
import { up as up4, down as down4 } from "../migrations/1716000003000-CreateTickets";

// ─── Migration registry (orden cronológico) ───────────────────────────────────

const MIGRATIONS = [
  { name: "1716000000000-CreateHardwareComponents", up: up1, down: down1 },
  { name: "1716000001000-AddExtensions",            up: up2, down: down2 },
  { name: "1716000002000-ExtendImageField",         up: up3, down: down3 },
  { name: "1716000003000-CreateTickets",            up: up4, down: down4 },
] as const;

// ─── Tabla de control ─────────────────────────────────────────────────────────

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL      PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(): Promise<Set<string>> {
  const res = await pool.query<{ name: string }>("SELECT name FROM _migrations ORDER BY id");
  return new Set(res.rows.map((r) => r.name));
}

async function markApplied(name: string): Promise<void> {
  await pool.query("INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
}

async function markReverted(name: string): Promise<void> {
  await pool.query("DELETE FROM _migrations WHERE name = $1", [name]);
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function runUp(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();
  let count = 0;

  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) {
      logger.info(`  [skip] ${m.name}`);
      continue;
    }
    logger.info(`  [run]  ${m.name}`);
    await m.up();
    await markApplied(m.name);
    count++;
    logger.info(`  [ok]   ${m.name}`);
  }

  logger.info(count === 0 ? "Todas las migraciones ya estaban aplicadas." : `${count} migración(es) aplicada(s).`);
}

async function runDown(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();

  // Revertir solo la última aplicada
  const toRevert = [...MIGRATIONS].reverse().find((m) => applied.has(m.name));
  if (!toRevert) {
    logger.info("No hay migraciones para revertir.");
    return;
  }

  logger.info(`  [down] ${toRevert.name}`);
  await toRevert.down();
  await markReverted(toRevert.name);
  logger.info(`  [ok]   revertido: ${toRevert.name}`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const command = process.argv[2] ?? "up";

(async () => {
  try {
    if (command === "down") {
      await runDown();
    } else {
      await runUp();
    }
  } catch (err) {
    logger.error(`Migración falló: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
