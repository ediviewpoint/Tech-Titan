import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";

const router = Router();

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const CreateHardwareSchema = z.object({
  name:     z.string().min(2).max(255),
  category: z.enum(["CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage"]),
  metadata: z.object({
    socket_type:    z.enum(["AM4", "AM5", "LGA1700", "LGA1200"]).optional(),
    form_factor:    z.enum(["ATX", "MATX", "ITX"]).optional(),
    ram_generation: z.enum(["DDR4", "DDR5"]).optional(),
    tdp_watts:      z.number().nonnegative().optional(),
    wattage_watts:  z.number().positive().optional(),
  }).optional().default({}),
});

// ─── POST /store/admin/hardware ───────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateHardwareSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Datos inválidos",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { name, category, metadata } = parsed.data;

  try {
    const result: QueryResult<{ id: string }> = await pool.query(
      `INSERT INTO hardware_components (name, category, metadata)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, category, JSON.stringify(metadata)]
    );

    logger.info(`[admin] POST /hardware → creado: "${name}" (${category}) id: ${result.rows[0].id}`);
    res.status(201).json({ id: result.rows[0].id, name, category, metadata });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno.";
    // Unique constraint violation → nombre duplicado
    if (message.includes("unique") || message.includes("duplicate")) {
      res.status(409).json({ error: `Ya existe un componente llamado "${name}"` });
      return;
    }
    logger.error(`[admin] POST /hardware falló: ${message}`);
    res.status(500).json({ error: message });
  }
});

// ─── DELETE /store/admin/hardware/:id ────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID inválido (debe ser UUID v4)." });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM hardware_components WHERE id = $1 RETURNING id, name",
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: `Componente ${id} no encontrado.` });
      return;
    }

    const { name } = result.rows[0];
    logger.info(`[admin] DELETE /hardware/${id} → eliminado: "${name}"`);
    res.status(200).json({ deleted: true, id, name });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[admin] DELETE /hardware/${id} falló: ${message}`);
    res.status(500).json({ error: message });
  }
});

export default router;
