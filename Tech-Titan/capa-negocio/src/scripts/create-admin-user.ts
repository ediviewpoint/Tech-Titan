/**
 * Crea el primer usuario administrador en la tabla `admin_users`.
 *
 * Uso:
 *   cd capa-negocio
 *   ts-node src/scripts/create-admin-user.ts
 */
import { Client } from "pg";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const scryptAsync = promisify(scrypt);

const DB_URL        = process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@techtitan.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "TechTitan2024!";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log("[OK] Conectado a PostgreSQL");

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT         NOT NULL,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await client.query(
      "SELECT id FROM admin_users WHERE email = $1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`[SKIP] El usuario "${ADMIN_EMAIL}" ya existe.`);
      return;
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const id = randomUUID();

    await client.query(
      `INSERT INTO admin_users (id, email, password_hash) VALUES ($1, $2, $3)`,
      [id, ADMIN_EMAIL, passwordHash]
    );

    console.log("\n════════════════════════════════════════════");
    console.log("  USUARIO ADMINISTRADOR CREADO");
    console.log("════════════════════════════════════════════");
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("════════════════════════════════════════════\n");

  } catch (error: unknown) {
    console.error("[ERROR]", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
