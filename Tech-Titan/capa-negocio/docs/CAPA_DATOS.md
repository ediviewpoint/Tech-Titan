# Capa de Datos - Arquitectura de Metadatos de Hardware

## Estrategia de Almacenamiento

Los metadatos técnicos de hardware se persisten en una columna `JSONB` de PostgreSQL.
Este diseño permite consultas indexadas sobre campos semiestructurados sin sacrificar
el esquema relacional base.

## Tabla: `hardware_components`

| Columna      | Tipo          | Descripción                                      |
|--------------|---------------|--------------------------------------------------|
| `id`         | `UUID`        | PK generada con `gen_random_uuid()`              |
| `name`       | `VARCHAR(255)`| Nombre comercial del componente (UNIQUE)         |
| `category`   | `VARCHAR(100)`| Categoria: CPU, Motherboard, RAM, GPU, PSU...    |
| `metadata`   | `JSONB`       | Especificaciones tecnicas (ver interfaz abajo)   |
| `created_at` | `TIMESTAMPTZ` | Timestamp de insercion                           |
| `updated_at` | `TIMESTAMPTZ` | Timestamp de ultima modificacion                 |

## Interfaz TypeScript: `HardwareMetadata`

Definida en `types/hardware.ts`. Todos los campos son opcionales para soportar
distintos tipos de componentes sin forzar nulls innecesarios.

```typescript
interface HardwareMetadata {
  socket_type?:    "AM4" | "AM5" | "LGA1700" | "LGA1200"
  form_factor?:    "ATX" | "MATX" | "ITX"
  tdp_watts?:      number
  ram_generation?: "DDR4" | "DDR5"
}
```

### Ejemplo de fila almacenada (CPU)

```json
{
  "id": "a1b2c3d4-...",
  "name": "AMD Ryzen 7 7800X3D",
  "category": "CPU",
  "metadata": {
    "socket_type": "AM5",
    "tdp_watts": 120
  }
}
```

## Indices JSONB

Se crean indices de expresion sobre los campos mas consultados:

```sql
-- Filtrar CPUs/Motherboards por socket compatible
CREATE INDEX idx_hardware_socket
  ON hardware_components ((metadata->>'socket_type'));

-- Filtrar RAMs por generacion
CREATE INDEX idx_hardware_ram_gen
  ON hardware_components ((metadata->>'ram_generation'));
```

Estos indices evitan seq-scans al ejecutar consultas de compatibilidad.

## Consultas de Compatibilidad

### Encontrar todos los componentes AM5

```sql
SELECT name, category, metadata
FROM   hardware_components
WHERE  metadata->>'socket_type' = 'AM5';
```

### Validar bundle completo (CPU + MB + RAM del mismo socket + generacion)

```sql
SELECT
  cpu.name  AS cpu,
  mb.name   AS motherboard,
  ram.name  AS ram
FROM
  hardware_components cpu
  JOIN hardware_components mb
    ON mb.category = 'Motherboard'
   AND mb.metadata->>'socket_type' = cpu.metadata->>'socket_type'
  JOIN hardware_components ram
    ON ram.category = 'RAM'
WHERE
  cpu.category = 'CPU'
  AND cpu.metadata->>'socket_type' = 'AM5';
```

## Integracion con MedusaJS

En Sprint 2, `hardware_components` se alineara con la entidad `Product` de MedusaJS:

- Los metadatos se moveran a la columna `metadata` (tipo `json`) de la tabla `product`.
- Se creara un modulo personalizado `HardwareCompatibilityModule` que consultara
  estos campos para validar bundles antes de agregarlos al carrito.
- Redis almacenara en cache los resultados de compatibilidad con TTL de 30 segundos.

## Bundle Inicial (Sprint 1 Seed)

| Componente               | Categoria    | Socket | TDP  | RAM  | Form Factor |
|--------------------------|--------------|--------|------|------|-------------|
| AMD Ryzen 7 7800X3D      | CPU          | AM5    | 120W | -    | -           |
| MSI MAG B650 TOMAHAWK    | Motherboard  | AM5    | -    | -    | ATX         |
| G.Skill Flare X5 32GB    | RAM          | -      | -    | DDR5 | -           |

La compatibilidad del bundle esta garantizada: CPU AM5 + MB AM5 + DDR5 (B650 soporta DDR5 nativamente).
