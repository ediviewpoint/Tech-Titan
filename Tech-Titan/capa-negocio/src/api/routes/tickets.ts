import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TYPES   = ["bug", "pedido", "consulta", "sugerencia"] as const;
const VALID_STATUS  = ["abierto", "en_proceso", "resuelto"] as const;

const CreateTicketSchema = z.object({
  name:        z.string().min(1).max(255).trim(),
  email:       z.string().email().optional().or(z.literal("")),
  type:        z.enum(VALID_TYPES).default("consulta"),
  description: z.string().min(5).max(2000).trim(),
});

const UpdateTicketSchema = z.object({
  status: z.enum(VALID_STATUS),
});

// ─── POST /store/tickets ──────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateTicketSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { name, email, type, description } = parsed.data;

  try {
    const result: QueryResult<{ id: string; created_at: Date }> = await pool.query(
      `INSERT INTO tickets (name, email, type, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [name, email || null, type, description]
    );

    const ticket = result.rows[0]!;
    logger.info(`[tickets] nuevo: ${ticket.id} tipo=${type} de="${name}"`);

    res.status(201).json({
      id:         ticket.id,
      name,
      type,
      status:     "abierto",
      created_at: ticket.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`[tickets] POST: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── GET /store/admin/tickets ─────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result: QueryResult<{
      id: string; name: string; email: string | null;
      type: string; description: string; status: string; created_at: Date;
    }> = await pool.query(
      `SELECT id, name, email, type, description, status, created_at
       FROM tickets
       ORDER BY
         CASE status WHEN 'abierto' THEN 0 WHEN 'en_proceso' THEN 1 ELSE 2 END,
         created_at DESC
       LIMIT 200`
    );

    res.json({ tickets: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`[tickets] GET: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── PATCH /store/admin/tickets/:id ──────────────────────────────────────────

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Estado inválido", details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE tickets SET status = $1 WHERE id = $2 RETURNING id, status`,
      [parsed.data.status, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: `Ticket ${id} no encontrado` });
      return;
    }

    logger.info(`[tickets] PATCH ${id} → ${parsed.data.status}`);
    res.json({ id, status: parsed.data.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`[tickets] PATCH ${id}: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

export default router;
