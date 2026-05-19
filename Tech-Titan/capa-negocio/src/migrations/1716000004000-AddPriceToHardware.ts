import pool from "../lib/db";
export async function up(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE hardware_components ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2) NOT NULL DEFAULT 0`);
  } finally {
    client.release();
  }
}
export async function down(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE hardware_components DROP COLUMN IF EXISTS price_usd`);
  } finally {
    client.release();
  }
}