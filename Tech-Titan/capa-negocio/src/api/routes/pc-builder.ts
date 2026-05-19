import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import pool from "../../lib/db";
import logger from "../../lib/logger";
import { cacheGet, cacheSet } from "../../lib/redis";
import { validatePCBuild } from "../../services/compatibility";
import { validateProductIds, type ValidatedProductIdsBody } from "../middleware/validate-product-ids";
import { type CartItem, ComponentCategory, type HardwareMetadata } from "../../types/hardware";

const router = Router();

// ─── Shared types ─────────────────────────────────────────────────────────────

interface HardwareComponentRow {
  id:          string;
  name:        string;
  category:    string;
  price_usd:   string;
  metadata:    HardwareMetadata;
  svg_key:     string | null;
  stock:       number;
  description: string | null;
}

function isComponentCategory(value: string): value is ComponentCategory {
  return (Object.values(ComponentCategory) as string[]).includes(value);
}

function mapRowToCartItem(row: HardwareComponentRow): CartItem {
  if (!isComponentCategory(row.category)) {
    throw new Error(`Categoría desconocida: "${row.category}" en "${row.name}"`);
  }
  return {
    product_id: row.id,
    name:       row.name,
    category:   row.category,
    metadata:   row.metadata,
  };
}

function mapRowToProduct(row: HardwareComponentRow) {
  return {
    id:          row.id,
    name:        row.name,
    category:    row.category,
    price_usd:   parseFloat(row.price_usd),
    metadata:    row.metadata,
    svg_key:     row.svg_key ?? undefined,
    stock:       row.stock ?? 0,
    description: row.description ?? undefined,
  };
}

// ─── GET /store/pc-builder/products ──────────────────────────────────────────
// Query params:
//   category  — filtra por categoría (CPU, GPU, etc.)
//   search    — búsqueda en nombre y descripción (ILIKE)
//   min_price — precio mínimo en USD
//   max_price — precio máximo en USD

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const category  = typeof req.query["category"]  === "string" ? req.query["category"]  : undefined;
  const search    = typeof req.query["search"]    === "string" ? req.query["search"].trim() : undefined;
  const minPrice  = typeof req.query["min_price"] === "string" ? parseFloat(req.query["min_price"]) : undefined;
  const maxPrice  = typeof req.query["max_price"] === "string" ? parseFloat(req.query["max_price"]) : undefined;

  const hasFilters = Boolean(search || minPrice !== undefined || maxPrice !== undefined);

  // Cache sólo para consultas sin filtros extra (solo por categoría)
  const cacheKey = `products:${category ?? "all"}`;
  if (!hasFilters) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info(`GET /products → cache hit [${cacheKey}]`);
      res.status(200).json(JSON.parse(cached));
      return;
    }
  }

  try {
    const conditions: string[] = [];
    const params: unknown[]    = [];
    let   idx = 1;

    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (minPrice !== undefined && !isNaN(minPrice)) {
      conditions.push(`price_usd >= $${idx++}`);
      params.push(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      conditions.push(`price_usd <= $${idx++}`);
      params.push(maxPrice);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql   = `SELECT id, name, category, price_usd, metadata, svg_key, stock, description
                   FROM hardware_components ${where}
                   ORDER BY ${category ? "price_usd" : "category, price_usd"}`;

    const result: QueryResult<HardwareComponentRow> = await pool.query(sql, params);

    const payload = { products: result.rows.map(mapRowToProduct) };

    // Guardar en cache solo si no hay filtros adicionales
    if (!hasFilters) {
      await cacheSet(cacheKey, JSON.stringify(payload));
      logger.info(`GET /products → DB + cache set [${cacheKey}] (${result.rowCount} items)`);
    } else {
      logger.info(`GET /products → DB [search="${search}" min=${minPrice} max=${maxPrice}] → ${result.rowCount} items`);
    }

    res.status(200).json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno.";
    logger.error(`GET /products falló: ${message}`);
    res.status(500).json({ error: message });
  }
});

// ─── POST /store/pc-builder/validate ─────────────────────────────────────────

router.post(
  "/validate",
  validateProductIds,
  async (req: Request, res: Response): Promise<void> => {
    const { product_ids } = req.body as ValidatedProductIdsBody;

    try {
      const result: QueryResult<HardwareComponentRow> = await pool.query(
        "SELECT id, name, category, price_usd, metadata, svg_key, stock, description FROM hardware_components WHERE id = ANY($1::uuid[])",
        [product_ids]
      );

      const foundIds   = new Set(result.rows.map((r) => r.id));
      const missingIds = product_ids.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        res.status(404).json({ error: `Productos no encontrados: ${missingIds.join(", ")}` });
        return;
      }

      const items:      CartItem[]       = result.rows.map(mapRowToCartItem);
      const validation                   = validatePCBuild(items);

      if (validation.errors.length > 0) {
        logger.warn(
          `POST /validate → incompatibilidad en [${items.map((i) => i.name).join(", ")}]: ` +
          validation.errors.join(" | ")
        );
      } else {
        logger.info(`POST /validate → build compatible: [${items.map((i) => i.name).join(", ")}]`);
      }

      res.status(200).json(validation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error interno.";
      logger.error(`POST /validate → excepción: ${message}`);
      res.status(500).json({ error: message });
    }
  }
);

// ─── GET /store/pc-builder/build?ids=uuid1,uuid2,... ─────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/build", async (req: Request, res: Response): Promise<void> => {
  const rawIds = req.query["ids"];

  if (typeof rawIds !== "string" || !rawIds.trim()) {
    res.status(400).json({ error: "El parámetro 'ids' es obligatorio." });
    return;
  }

  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean);

  if (ids.length === 0 || ids.length > 20) {
    res.status(400).json({ error: "Se requiere entre 1 y 20 IDs." });
    return;
  }

  const invalid = ids.filter((id) => !UUID_RE.test(id));
  if (invalid.length > 0) {
    res.status(400).json({ error: `IDs inválidos: ${invalid.join(", ")}` });
    return;
  }

  try {
    const result: QueryResult<HardwareComponentRow> = await pool.query(
      "SELECT id, name, category, price_usd, metadata, svg_key, stock, description FROM hardware_components WHERE id = ANY($1::uuid[]) ORDER BY category",
      [ids]
    );

    logger.info(`GET /build → ${result.rowCount} productos por ID`);
    res.status(200).json({ products: result.rows.map(mapRowToProduct) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno.";
    logger.error(`GET /build falló: ${message}`);
    res.status(500).json({ error: message });
  }
});

export default router;
