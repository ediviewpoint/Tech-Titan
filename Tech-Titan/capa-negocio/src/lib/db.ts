import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Railway provee DATABASE_URL; desarrollo local usa DB_URL o el fallback
const connectionString =
  process.env.DATABASE_URL ??
  process.env.DB_URL       ??
  "postgres://postgres:postgres@localhost:5432/techtitan_db";

const pool = new Pool({
  connectionString,
  max:                    10,
  idleTimeoutMillis:      30_000,
  connectionTimeoutMillis: 3_000,
  // Railway usa SSL en producción
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;
