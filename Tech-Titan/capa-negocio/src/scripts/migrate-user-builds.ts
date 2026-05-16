import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const DB_URL =
  process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";

async function main(): Promise<void> {
  const client = new Client({ connectionString: DB_URL });

  try {
    console.log("Conectando a PostgreSQL...");
    await client.connect();
    console.log("[OK] Conectado");

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_builds (
        id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      VARCHAR(255)  NOT NULL,
        user_email   VARCHAR(255)  NOT NULL,
        build_name   VARCHAR(255)  NOT NULL,
        components   JSONB         NOT NULL DEFAULT '[]',
        total_price  INTEGER       NOT NULL DEFAULT 0,
        total_tdp    INTEGER       NOT NULL DEFAULT 0,
        is_valid     BOOLEAN       NOT NULL DEFAULT false,
        created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_builds_user_id
        ON user_builds (user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_builds_email
        ON user_builds (user_email)
    `);

    console.log("[OK] Tabla user_builds e indices listos");
    console.log("[DONE] Migracion completada");
  } catch (error: unknown) {
    console.error("[ERROR]", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
