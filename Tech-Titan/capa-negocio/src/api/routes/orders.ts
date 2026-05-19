import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const OrderItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  name:       z.string().min(1).max(255),
  category:   z.string().min(1).max(100),
  price_usd:  z.number().nonnegative(),
  quantity:   z.number().int().positive().default(1),
  svg_key:    z.string().max(2048).optional(),
  metadata:   z.record(z.unknown()).optional().default({}),
});

const CreateOrderSchema = z.object({
  user_email:    z.string().email().optional(),
  items:         z.array(OrderItemSchema).min(1),
  currency:      z.string().min(1).max(10),
  total_usd:     z.number().nonnegative(),
  total_local:   z.number().nonnegative().optional(),
  exchange_rate: z.number().positive().optional(),
  notes:         z.string().optional(),
});

// ─── POST /store/orders ───────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const {
    user_email,
    items,
    currency,
    total_usd,
    total_local,
    exchange_rate,
    notes,
  } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult: QueryResult<{
      id: string; status: string; total_usd: string; created_at: Date;
    }> = await client.query(
      `INSERT INTO orders (user_email, currency, total_usd, total_local, exchange_rate, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, status, total_usd, created_at`,
      [user_email ?? null, currency, total_usd, total_local ?? null, exchange_rate ?? null, notes ?? null]
    );

    const order = orderResult.rows[0]!;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, category, price_usd, quantity, svg_key, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          item.product_id ?? null,
          item.name,
          item.category,
          item.price_usd,
          item.quantity,
          item.svg_key ?? null,
          JSON.stringify(item.metadata),
        ]
      );
    }

    await client.query("COMMIT");

    logger.info(`[orders] POST / → orden ${order.id} creada con ${items.length} ítem(s)`);
    res.status(201).json({
      id:          order.id,
      status:      order.status,
      total_usd:   parseFloat(order.total_usd),
      items_count: items.length,
      created_at:  order.created_at,
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[orders] POST /: ${msg}`);
    res.status(500).json({ error: msg });
  } finally {
    client.release();
  }
});

// ─── GET /store/orders/:id ────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID inválido (UUID v4 requerido)." });
    return;
  }

  try {
    const orderResult: QueryResult<{
      id: string; user_email: string | null; status: string; currency: string;
      total_usd: string; total_local: string | null; exchange_rate: string | null;
      notes: string | null; created_at: Date; updated_at: Date;
    }> = await pool.query(
      `SELECT id, user_email, status, currency, total_usd, total_local, exchange_rate, notes, created_at, updated_at
       FROM orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rowCount === 0) {
      res.status(404).json({ error: `Orden ${id} no encontrada.` });
      return;
    }

    const order = orderResult.rows[0]!;

    const itemsResult: QueryResult<{
      id: string; product_id: string | null; name: string; category: string;
      price_usd: string; quantity: number; svg_key: string | null; metadata: unknown;
    }> = await pool.query(
      `SELECT id, product_id, name, category, price_usd, quantity, svg_key, metadata
       FROM order_items WHERE order_id = $1 ORDER BY name`,
      [id]
    );

    res.json({
      ...order,
      total_usd:    parseFloat(order.total_usd),
      total_local:  order.total_local  !== null ? parseFloat(order.total_local)  : null,
      exchange_rate: order.exchange_rate !== null ? parseFloat(order.exchange_rate) : null,
      items: itemsResult.rows.map((item) => ({
        ...item,
        price_usd: parseFloat(item.price_usd),
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[orders] GET /${id}: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── GET /store/orders ────────────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result: QueryResult<{
      id: string; user_email: string | null; status: string; currency: string;
      total_usd: string; total_local: string | null; created_at: Date;
    }> = await pool.query(
      `SELECT id, user_email, status, currency, total_usd, total_local, created_at
       FROM orders ORDER BY created_at DESC LIMIT 50`
    );

    res.json({
      orders: result.rows.map((r) => ({
        ...r,
        total_usd:   parseFloat(r.total_usd),
        total_local: r.total_local !== null ? parseFloat(r.total_local) : null,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[orders] GET /: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

export default router;
