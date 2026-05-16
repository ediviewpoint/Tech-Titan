"use strict";

var _pg = require("pg");
var dotenv = _interopRequireWildcard(require("dotenv"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
dotenv.config();
const DB_URL = process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";
async function main() {
  const client = new _pg.Client({
    connectionString: DB_URL
  });
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
  } catch (error) {
    console.error("[ERROR]", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}
main();