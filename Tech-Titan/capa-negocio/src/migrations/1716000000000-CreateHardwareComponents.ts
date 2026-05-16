import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: CreateHardwareComponents
 *
 * Crea la tabla hardware_components con índices JSONB parciales.
 * IF NOT EXISTS garantiza idempotencia — seguro de ejecutar múltiples veces.
 *
 * Ejecución:
 *   cd capa-negocio && npm run migrations:run
 *
 * Rollback:
 *   npx medusa migrations revert   (ejecuta el método `down`)
 */
export class CreateHardwareComponents1716000000000 implements MigrationInterface {
  name = "CreateHardwareComponents1716000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extensión requerida para gen_random_uuid() ────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ── Tabla principal ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hardware_components (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL UNIQUE,
        category    VARCHAR(100) NOT NULL,
        metadata    JSONB        NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // ── Índice por categoría (queries de filtrado del PC Builder) ─────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_category
        ON hardware_components (category)
    `);

    // ── Índices JSONB parciales (expression indexes en PostgreSQL) ─────────
    // Permiten filtrar por metadata->>'socket_type' sin full-table scan.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_socket
        ON hardware_components ((metadata->>'socket_type'))
        WHERE metadata->>'socket_type' IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_ram_gen
        ON hardware_components ((metadata->>'ram_generation'))
        WHERE metadata->>'ram_generation' IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_hardware_category_socket
        ON hardware_components (category, (metadata->>'socket_type'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hardware_category_socket`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hardware_ram_gen`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hardware_socket`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hardware_category`);
    await queryRunner.query(`DROP TABLE IF EXISTS hardware_components`);
  }
}
