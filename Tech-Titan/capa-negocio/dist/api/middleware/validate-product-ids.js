"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateProductIds = validateProductIds;
var _zod = require("zod");
var _logger = _interopRequireDefault(require("../../lib/logger"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// ─── Zod contract ─────────────────────────────────────────────────────────────
// Define el contrato de entrada UNA vez. Sirve como documentación viva del API
// y garantiza que el CompatibilityService nunca recibe datos sucios.

const ProductIdsSchema = _zod.z.object({
  product_ids: _zod.z.array(_zod.z.string().uuid({
    message: "Cada elemento debe ser un UUID v4 válido"
  }), {
    message: "El campo 'product_ids' debe ser un array de UUIDs"
  }).min(1, "Se requiere al menos un producto").max(10, "Máximo 10 productos por validación de build")
});
// ─── Middleware ────────────────────────────────────────────────────────────────

function validateProductIds(req, res, next) {
  const result = ProductIdsSchema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    _logger.default.warn(`[validateProductIds] Body rechazado: ${JSON.stringify(fieldErrors)}`);
    res.status(400).json({
      error: "Datos de entrada inválidos",
      details: fieldErrors
    });
    return;
  }

  // Reemplaza req.body con los datos validados y parseados por Zod.
  // A partir de aquí, cualquier handler downstream puede confiar en la forma.
  req.body = result.data;
  next();
}