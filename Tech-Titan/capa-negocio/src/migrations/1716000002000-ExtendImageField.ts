import pool from "../lib/db";

// Extiende svg_key a TEXT para soportar URLs de imagen externas
export async function up(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE hardware_components ALTER COLUMN svg_key TYPE TEXT`
    );
    await client.query(
      `ALTER TABLE order_items ALTER COLUMN svg_key TYPE TEXT`
    );
  } finally {
    client.release();
  }
}

export async function down(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE hardware_components ALTER COLUMN svg_key TYPE VARCHAR(100)`
    );
    await client.query(
      `ALTER TABLE order_items ALTER COLUMN svg_key TYPE VARCHAR(100)`
    );
  } finally {
    client.release();
  }
}
