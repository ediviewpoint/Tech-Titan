import pool from "../lib/db";

export async function up(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255),
        type        VARCHAR(50)  NOT NULL DEFAULT 'consulta',
        description TEXT         NOT NULL,
        status      VARCHAR(50)  NOT NULL DEFAULT 'abierto',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status
        ON tickets (status, created_at DESC)
    `);
  } finally {
    client.release();
  }
}

export async function down(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`DROP INDEX  IF EXISTS idx_tickets_status`);
    await client.query(`DROP TABLE  IF EXISTS tickets`);
  } finally {
    client.release();
  }
}
