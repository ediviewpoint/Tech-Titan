-- ═══════════════════════════════════════════════════════════════════════════
-- Tech-Titan :: Esquema de Base de Datos
-- Versión: 2.0  |  Motor: PostgreSQL 15
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Este script es IDEMPOTENTE (IF NOT EXISTS en todo).
-- La migración oficial vive en: capa-negocio/src/migrations/
-- Este archivo sirve como documentación y referencia de DBA.
--
-- Ejecución manual (solo para revisión):
--   psql -h localhost -p 5433 -U postgres -d techtitan_db -f init-db.sql

-- ─── Extensiones ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA: hardware_components
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Estrategia de metadatos: JSONB
--   Permite almacenar atributos heterogéneos sin ALTER TABLE.
--   Cada categoría usa un subconjunto diferente de metadata:
--
--   CPU:
--     { "socket_type": "AM5"|"LGA1700", "tdp_watts": <int> }
--
--   Motherboard:
--     { "socket_type": "AM5"|"LGA1700", "form_factor": "ATX"|"MATX"|"ITX",
--       "ram_generation": "DDR4"|"DDR5" }
--
--   RAM:
--     { "ram_generation": "DDR4"|"DDR5" }
--
--   GPU:
--     { "tdp_watts": <int> }
--
--   PSU:
--     { "wattage_watts": <int> }
--
--   Storage:
--     { "form_factor": "ATX"|"MATX"|"ITX" }  (opcional)

CREATE TABLE IF NOT EXISTS hardware_components (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  category    VARCHAR(100) NOT NULL,
  metadata    JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice B-tree: acelera WHERE category = $1 (query principal del PC Builder)
CREATE INDEX IF NOT EXISTS idx_hardware_category
  ON hardware_components (category);

-- Índice de expresión JSONB: acelera filtros por socket_type
CREATE INDEX IF NOT EXISTS idx_hardware_socket
  ON hardware_components ((metadata->>'socket_type'))
  WHERE metadata->>'socket_type' IS NOT NULL;

-- Índice de expresión JSONB: acelera filtros por ram_generation
CREATE INDEX IF NOT EXISTS idx_hardware_ram_gen
  ON hardware_components ((metadata->>'ram_generation'))
  WHERE metadata->>'ram_generation' IS NOT NULL;

-- Índice compuesto: category + socket (queries de compatibilidad)
CREATE INDEX IF NOT EXISTS idx_hardware_category_socket
  ON hardware_components (category, (metadata->>'socket_type'));

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA: user_builds
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Almacena builds guardados por usuarios autenticados.
-- components: array JSONB de CartItem (product_id + name + category + metadata)

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
);

CREATE INDEX IF NOT EXISTS idx_user_builds_user_id
  ON user_builds (user_id);

CREATE INDEX IF NOT EXISTS idx_user_builds_email
  ON user_builds (user_email);

-- ─── Verificación post-creación ───────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
