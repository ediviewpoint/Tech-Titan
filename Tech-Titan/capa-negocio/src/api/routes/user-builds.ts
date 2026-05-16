import { Router, type Request, type Response } from "express";
import { type QueryResult } from "pg";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateBuildSchema = z.object({
  userId:     z.string().min(1),
  userEmail:  z.string().email(),
  buildName:  z.string().min(1).max(100),
  components: z.array(z.record(z.string(), z.unknown())),
  totalPrice: z.number().nonnegative().int(),
  totalTdp:   z.number().nonnegative().int(),
  isValid:    z.boolean(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserBuildRow {
  id:          string;
  user_id:     string;
  user_email:  string;
  build_name:  string;
  components:  unknown[];
  total_price: number;
  total_tdp:   number;
  is_valid:    boolean;
  created_at:  Date;
}

// ─── GET /store/user-builds?userId=xxx ───────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId =
    typeof req.query["userId"] === "string" ? req.query["userId"] : undefined;

  if (!userId) {
    res.status(400).json({ error: "Parámetro 'userId' es requerido" });
    return;
  }

  try {
    const result: QueryResult<UserBuildRow> = await pool.query(
      "SELECT * FROM user_builds WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    logger.info(`GET /user-builds → ${result.rowCount} builds para userId: ${userId}`);
    res.status(200).json({ builds: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`GET /user-builds error: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── POST /store/user-builds ─────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateBuildSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:   "Datos inválidos",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { userId, userEmail, buildName, components, totalPrice, totalTdp, isValid } =
    parsed.data;

  try {
    const result: QueryResult<{ id: string }> = await pool.query(
      `INSERT INTO user_builds (user_id, user_email, build_name, components, total_price, total_tdp, is_valid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, userEmail, buildName, JSON.stringify(components), totalPrice, totalTdp, isValid]
    );
    logger.info(`POST /user-builds → "${buildName}" para ${userEmail} [${result.rows[0]!.id}]`);
    res.status(201).json({ id: result.rows[0]!.id, buildName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`POST /user-builds error: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── DELETE /store/user-builds/:id ───────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM user_builds WHERE id = $1", [id]);
    logger.info(`DELETE /user-builds/${id}`);
    res.status(200).json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`DELETE /user-builds error: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

export default router;
