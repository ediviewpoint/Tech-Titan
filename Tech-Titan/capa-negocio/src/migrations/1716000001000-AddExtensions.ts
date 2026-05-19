import pool from "../lib/db";

export async function up(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── Extend hardware_components ──────────────────────────────────────────
    await client.query(`ALTER TABLE hardware_components ADD COLUMN IF NOT EXISTS svg_key     VARCHAR(100)`);
    await client.query(`ALTER TABLE hardware_components ADD COLUMN IF NOT EXISTS stock       INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE hardware_components ADD COLUMN IF NOT EXISTS description TEXT`);

    // ── Orders table ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email    VARCHAR(255),
        status        VARCHAR(50)   NOT NULL DEFAULT 'pending',
        currency      VARCHAR(10)   NOT NULL DEFAULT 'USD',
        total_usd     NUMERIC(10,2) NOT NULL,
        total_local   NUMERIC(14,2),
        exchange_rate NUMERIC(10,4) DEFAULT 1,
        notes         TEXT,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── Order items table ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id   UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID,
        name       VARCHAR(255)  NOT NULL,
        category   VARCHAR(100)  NOT NULL,
        price_usd  NUMERIC(10,2) NOT NULL,
        quantity   INTEGER       NOT NULL DEFAULT 1,
        svg_key    VARCHAR(100),
        metadata   JSONB         NOT NULL DEFAULT '{}'
      )
    `);
  } finally {
    client.release();
  }
}

export async function down(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`DROP TABLE IF EXISTS order_items`);
    await client.query(`DROP TABLE IF EXISTS orders`);
    await client.query(`ALTER TABLE hardware_components DROP COLUMN IF EXISTS description`);
    await client.query(`ALTER TABLE hardware_components DROP COLUMN IF EXISTS stock`);
    await client.query(`ALTER TABLE hardware_components DROP COLUMN IF EXISTS svg_key`);
  } finally {
    client.release();
  }
}
