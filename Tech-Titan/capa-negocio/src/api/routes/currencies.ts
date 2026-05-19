import { Router, type Request, type Response } from "express";
import { z } from "zod";
import pool from "../../lib/db";
import logger from "../../lib/logger";

const router = Router();

// Clave de admin requerida para escribir (GET es público).
// Configura ADMIN_API_KEY en .env para proteger el endpoint.
function requireAdminKey(req: Request, res: Response): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return true; // sin clave configurada → abierto (solo desarrollo)
  const provided = req.headers["x-admin-key"];
  if (provided !== adminKey) {
    res.status(401).json({ error: "API key inválida." });
    return false;
  }
  return true;
}

// ─── GET /store/currencies ────────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<{
      currency_code: string;
      currency_name: string;
      rate_to_usd:   string;
      symbol:        string;
      updated_at:    Date;
    }>(
      "SELECT currency_code, currency_name, rate_to_usd, symbol, updated_at FROM exchange_rates ORDER BY currency_code"
    );

    const rates = result.rows.map((r) => ({
      currency_code: r.currency_code,
      currency_name: r.currency_name,
      rate_to_usd:   parseFloat(r.rate_to_usd),
      symbol:        r.symbol,
      updated_at:    r.updated_at.toISOString(),
    }));

    res.json({ rates });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`GET /currencies error: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── PATCH /store/currencies/:code ───────────────────────────────────────────
// Actualiza el tipo de cambio. Requiere x-admin-key en el header.

const UpdateRateSchema = z.object({
  rate_to_usd: z.number().positive("El tipo de cambio debe ser mayor a 0"),
});

router.patch("/:code", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdminKey(req, res)) return;

  const code   = req.params.code?.toUpperCase();
  const parsed = UpdateRateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const result = await pool.query<{ currency_code: string; rate_to_usd: string; updated_at: Date }>(
      `UPDATE exchange_rates
          SET rate_to_usd = $1,
              updated_at  = NOW()
        WHERE currency_code = $2
       RETURNING currency_code, rate_to_usd, updated_at`,
      [parsed.data.rate_to_usd, code]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: `Moneda "${code}" no encontrada.` });
      return;
    }

    const row = result.rows[0]!;
    logger.info(`PATCH /currencies/${code} → 1 USD = ${parsed.data.rate_to_usd} ${code}`);
    res.json({
      currency_code: row.currency_code,
      rate_to_usd:   parseFloat(row.rate_to_usd),
      updated_at:    row.updated_at.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    logger.error(`PATCH /currencies/${code} error: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

export default router;
