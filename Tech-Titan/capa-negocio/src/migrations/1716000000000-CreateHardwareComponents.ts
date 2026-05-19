import pool from "../lib/db";

export async function up(): Promise<void> {
  const client = await pool.connect();
  try {
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

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_category
        ON hardware_components (category)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_socket
        ON hardware_components ((metadata->>'socket_type'))
        WHERE metadata->>'socket_type' IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_ram_gen
        ON hardware_components ((metadata->>'ram_generation'))
        WHERE metadata->>'ram_generation' IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_category_socket
        ON hardware_components (category, (metadata->>'socket_type'))
    `);
  } finally {
    client.release();
  }
}

export async function down(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`DROP INDEX IF EXISTS idx_hardware_category_socket`);
    await client.query(`DROP INDEX IF EXISTS idx_hardware_ram_gen`);
    await client.query(`DROP INDEX IF EXISTS idx_hardware_socket`);
    await client.query(`DROP INDEX IF EXISTS idx_hardware_category`);
    await client.query(`DROP TABLE IF EXISTS hardware_components`);
  } finally {
    client.release();
  }
}
