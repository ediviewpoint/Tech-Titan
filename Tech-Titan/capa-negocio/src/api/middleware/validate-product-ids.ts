import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import logger from "../../lib/logger";

// ─── Zod contract ─────────────────────────────────────────────────────────────
// Define el contrato de entrada UNA vez. Sirve como documentación viva del API
// y garantiza que el CompatibilityService nunca recibe datos sucios.

const ProductIdsSchema = z.object({
  product_ids: z
    .array(
      z.string().uuid({ message: "Cada elemento debe ser un UUID v4 válido" }),
      { message: "El campo 'product_ids' debe ser un array de UUIDs" }
    )
    .min(1, "Se requiere al menos un producto")
    .max(10, "Máximo 10 productos por validación de build"),
});

export type ValidatedProductIdsBody = z.infer<typeof ProductIdsSchema>;

// ─── Middleware ────────────────────────────────────────────────────────────────

export function validateProductIds(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = ProductIdsSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    logger.warn(
      `[validateProductIds] Body rechazado: ${JSON.stringify(fieldErrors)}`
    );
    res.status(400).json({
      error: "Datos de entrada inválidos",
      details: fieldErrors,
    });
    return;
  }

  // Reemplaza req.body con los datos validados y parseados por Zod.
  // A partir de aquí, cualquier handler downstream puede confiar en la forma.
  req.body = result.data;
  next();
}
