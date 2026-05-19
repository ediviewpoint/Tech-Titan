import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";
import { cacheInvalidate } from "../../lib/redis";

const router = Router();

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const CategoryEnum = z.enum([
  "CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage", "Case", "Cooler",
]);

const MetadataSchema = z.object({
  socket_type:            z.enum(["AM4", "AM5", "LGA1700", "LGA1200"]).optional(),
  form_factor:            z.enum(["ATX", "MATX", "ITX"]).optional(),
  ram_generation:         z.enum(["DDR4", "DDR5"]).optional(),
  tdp_watts:              z.number().nonnegative().optional(),
  wattage_watts:          z.number().positive().optional(),
  speed_mhz:              z.number().positive().optional(),
  capacity_gb:            z.number().positive().optional(),
  vram_gb:                z.number().positive().optional(),
  interface_type:         z.enum(["NVMe_PCIe4", "NVMe_PCIe3", "SATA", "HDD"]).optional(),
  storage_capacity_gb:    z.number().positive().optional(),
  supported_form_factors: z.array(z.enum(["ATX", "MATX", "ITX"])).optional(),
  cooler_type:            z.enum(["Stock", "Air", "AIO_120", "AIO_240", "AIO_280", "AIO_360"]).optional(),
  supported_sockets:      z.array(z.enum(["AM4", "AM5", "LGA1700", "LGA1200"])).optional(),
  tdp_rating:             z.number().positive().optional(),
}).optional().default({});

const CreateHardwareSchema = z.object({
  name:        z.string().min(2).max(255),
  category:    CategoryEnum,
  price_usd:   z.number().nonnegative().default(0),
  svg_key:     z.string().max(2048).optional(), // permite URLs de imagen externas
  stock:       z.number().int().nonnegative().default(0),
  description: z.string().max(2000).optional(),
  metadata:    MetadataSchema,
});

const UpdateHardwareSchema = z.object({
  name:        z.string().min(2).max(255).optional(),
  price_usd:   z.number().nonnegative().optional(),
  svg_key:     z.string().max(2048).optional(), // permite URLs de imagen externas
  stock:       z.number().int().nonnegative().optional(),
  description: z.string().max(2000).optional(),
  metadata:    MetadataSchema,
});

// ─── GET /store/admin/hardware ────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result: QueryResult<{
      id: string; name: string; category: string; price_usd: string;
      svg_key: string | null; stock: number; description: string | null;
      metadata: unknown; updated_at: Date;
    }> = await pool.query(
      "SELECT id, name, category, price_usd, svg_key, stock, description, metadata, updated_at FROM hardware_components ORDER BY category, price_usd"
    );

    res.json({
      components: result.rows.map((r) => ({
        ...r,
        price_usd: parseFloat(r.price_usd),
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`GET /admin/hardware: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── POST /store/admin/hardware ───────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateHardwareSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { name, category, price_usd, svg_key, stock, description, metadata } = parsed.data;

  try {
    const result: QueryResult<{ id: string }> = await pool.query(
      `INSERT INTO hardware_components (name, category, price_usd, svg_key, stock, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, category, price_usd, svg_key ?? null, stock, description ?? null, JSON.stringify(metadata)]
    );

    await cacheInvalidate("products:*");
    logger.info(`[admin] POST /hardware → "${name}" (${category}) $${price_usd}`);
    res.status(201).json({ id: result.rows[0]!.id, name, category, price_usd, svg_key, stock, description, metadata });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: `Ya existe un componente llamado "${name}"` });
      return;
    }
    logger.error(`[admin] POST /hardware: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── PUT /store/admin/hardware/:id ───────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID inválido (UUID v4 requerido)." });
    return;
  }

  const parsed = UpdateHardwareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const updates: string[] = [];
  const values:  unknown[] = [];
  let   idx = 1;

  if (parsed.data.name        !== undefined) { updates.push(`name        = $${idx++}`); values.push(parsed.data.name); }
  if (parsed.data.price_usd  !== undefined) { updates.push(`price_usd  = $${idx++}`); values.push(parsed.data.price_usd); }
  if (parsed.data.svg_key    !== undefined) { updates.push(`svg_key    = $${idx++}`); values.push(parsed.data.svg_key); }
  if (parsed.data.stock      !== undefined) { updates.push(`stock      = $${idx++}`); values.push(parsed.data.stock); }
  if (parsed.data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(parsed.data.description); }
  if (parsed.data.metadata   !== undefined) { updates.push(`metadata   = $${idx++}`); values.push(JSON.stringify(parsed.data.metadata)); }

  if (updates.length === 0) {
    res.status(400).json({ error: "Ningún campo para actualizar." });
    return;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE hardware_components SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, name, price_usd`,
      values
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: `Componente ${id} no encontrado.` });
      return;
    }
    const row = result.rows[0]!;
    await cacheInvalidate("products:*");
    logger.info(`[admin] PUT /hardware/${id} → actualizado "${row.name}"`);
    res.json({ id: row.id, name: row.name, price_usd: parseFloat(row.price_usd) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[admin] PUT /hardware/${id}: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── DELETE /store/admin/hardware/:id ────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID inválido." });
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
    const { name } = result.rows[0]!;
    await cacheInvalidate("products:*");
    logger.info(`[admin] DELETE /hardware/${id} → eliminado: "${name}"`);
    res.json({ deleted: true, id, name });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno.";
    logger.error(`[admin] DELETE /hardware/${id}: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

export default router;
