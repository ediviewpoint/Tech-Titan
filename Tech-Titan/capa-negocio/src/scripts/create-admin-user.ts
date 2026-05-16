/**
 * Crea el primer usuario administrador de MedusaJS.
 * Inserta directamente en la tabla `user` con bcrypt hash.
 *
 * Uso:
 *   cd capa-negocio
 *   ts-node src/scripts/create-admin-user.ts
 *
 * O via CLI de Medusa (alternativo):
 *   npx medusa user --email admin@techtitan.com --password TechTitan2024!
 */
import { Client } from "pg";
import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

dotenv.config();

const DB_URL =
  process.env.DB_URL ?? "postgres://postgres:password123@localhost:5433/techtitan_db";

// ── Credenciales del administrador ────────────────────────────────────────────
// Cambia estos valores antes de ejecutar en producción.
const ADMIN_EMAIL     = "admin@techtitan.com";
const ADMIN_PASSWORD  = "TechTitan2024!";
const ADMIN_FIRSTNAME = "Admin";
const ADMIN_LASTNAME  = "Tech-Titan";

async function main(): Promise<void> {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log("[OK] Conectado a PostgreSQL");

    // Verificar si el usuario ya existe
    const existing = await client.query(
      "SELECT id, email FROM public.user WHERE email = $1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`[SKIP] El usuario "${ADMIN_EMAIL}" ya existe (id: ${existing.rows[0].id})`);
      console.log("[INFO] Para resetear la contraseña, borra el usuario y vuelve a ejecutar.");
      return;
    }

    // Hash de la contraseña con bcrypt (salt rounds = 10, igual que MedusaJS)
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const id = randomUUID();
    await client.query(
      `INSERT INTO public.user
         (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'admin', NOW(), NOW())`,
      [id, ADMIN_EMAIL, passwordHash, ADMIN_FIRSTNAME, ADMIN_LASTNAME]
    );

    console.log("\n════════════════════════════════════════════");
    console.log("  USUARIO ADMINISTRADOR CREADO");
    console.log("════════════════════════════════════════════");
    console.log(`  ID:         ${id}`);
    console.log(`  Email:      ${ADMIN_EMAIL}`);
    console.log(`  Password:   ${ADMIN_PASSWORD}`);
    console.log(`  Role:       admin`);
    console.log("════════════════════════════════════════════");
    console.log("\n  URL de acceso: http://localhost:9000/app");
    console.log("════════════════════════════════════════════\n");

  } catch (error: unknown) {
    console.error("[ERROR]", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
