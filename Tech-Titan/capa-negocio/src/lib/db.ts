import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DB_URL ?? "postgres://postgres:postgres@localhost:5432/medusa_db",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
});

export default pool;
