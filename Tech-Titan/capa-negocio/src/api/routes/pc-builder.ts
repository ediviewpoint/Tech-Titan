import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import pool from "../../lib/db";
import logger from "../../lib/logger";
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

// ─── GET /store/pc-builder/products?category=CPU ─────────────────────────────

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const rawCategory = req.query["category"];
  const category    = typeof rawCategory === "string" ? rawCategory : undefined;

  try {
    const result: QueryResult<HardwareComponentRow> = category
      ? await pool.query(
          "SELECT id, name, category, price_usd, metadata, svg_key, stock, description FROM hardware_components WHERE category = $1 ORDER BY price_usd",
          [category]
        )
      : await pool.query(
          "SELECT id, name, category, price_usd, metadata, svg_key, stock, description FROM hardware_components ORDER BY category, price_usd"
        );

    logger.info(`GET /products → ${result.rowCount} (filtro: ${category ?? "todos"})`);
    res.status(200).json({ products: result.rows.map(mapRowToProduct) });
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
