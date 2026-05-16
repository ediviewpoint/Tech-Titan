"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = require("express");
var _db = _interopRequireDefault(require("../../lib/db"));
var _logger = _interopRequireDefault(require("../../lib/logger"));
var _compatibility = require("../../services/compatibility");
var _validateProductIds = require("../middleware/validate-product-ids");
var _hardware = require("../../types/hardware");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = (0, _express.Router)();

// ─── Shared types ─────────────────────────────────────────────────────────────

function isComponentCategory(value) {
  return Object.values(_hardware.ComponentCategory).includes(value);
}
function mapRowToCartItem(row) {
  if (!isComponentCategory(row.category)) {
    throw new Error(`Categoría desconocida: "${row.category}" para el componente "${row.name}"`);
  }
  return {
    product_id: row.id,
    name: row.name,
    category: row.category,
    metadata: row.metadata
  };
}

// ─── GET /store/pc-builder/products ──────────────────────────────────────────

router.get("/products", async (req, res) => {
  const rawCategory = req.query["category"];
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  try {
    const result = category ? await _db.default.query("SELECT id, name, category, metadata FROM hardware_components WHERE category = $1 ORDER BY name", [category]) : await _db.default.query("SELECT id, name, category, metadata FROM hardware_components ORDER BY category, name");
    _logger.default.info(`GET /products → ${result.rowCount} componentes (filtro: ${category ?? "ninguno"})`);
    res.status(200).json({
      products: result.rows
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno.";
    _logger.default.error(`GET /products falló: ${message}`, err instanceof Error ? err : undefined);
    res.status(500).json({
      error: message
    });
  }
});

// ─── POST /store/pc-builder/validate ─────────────────────────────────────────
// El middleware validateProductIds aplica Zod antes de que llegue este handler.
// Si el cuerpo no pasa la validación, el middleware responde 400 y next() nunca
// se llama — este handler solo ve datos garantizados como válidos.

router.post("/validate", _validateProductIds.validateProductIds, async (req, res) => {
  const {
    product_ids
  } = req.body;
  try {
    const result = await _db.default.query("SELECT id, name, category, metadata FROM hardware_components WHERE id = ANY($1::uuid[])", [product_ids]);
    const foundIds = new Set(result.rows.map(r => r.id));
    const missingIds = product_ids.filter(id => !foundIds.has(id));
    if (missingIds.length > 0) {
      _logger.default.warn(`POST /validate → productos no encontrados: [${missingIds.join(", ")}]`);
      res.status(404).json({
        error: `Productos no encontrados: ${missingIds.join(", ")}`
      });
      return;
    }
    const items = result.rows.map(mapRowToCartItem);
    const validation = (0, _compatibility.validatePCBuild)(items);

    // ── Observabilidad: registrar fallos críticos de compatibilidad ───────
    if (validation.errors.length > 0) {
      _logger.default.warn(`POST /validate → incompatibilidad detectada en [${items.map(i => i.name).join(", ")}]: ` + validation.errors.join(" | "));
    } else {
      _logger.default.info(`POST /validate → build compatible: [${items.map(i => i.name).join(", ")}]`);
    }
    res.status(200).json(validation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    _logger.default.error(`POST /validate → excepción inesperada: ${message}`, err instanceof Error ? err : undefined);
    res.status(500).json({
      error: message
    });
  }
});

// ─── GET /store/pc-builder/build?ids=uuid1,uuid2,... ─────────────────────────
// Devuelve múltiples productos por ID. Usado por la hydration de URL del frontend.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.get("/build", async (req, res) => {
  const rawIds = req.query["ids"];
  if (typeof rawIds !== "string" || !rawIds.trim()) {
    res.status(400).json({
      error: "El parámetro 'ids' es obligatorio (UUIDs separados por coma)."
    });
    return;
  }
  const ids = rawIds.split(",").map(s => s.trim()).filter(Boolean);
  if (ids.length === 0 || ids.length > 20) {
    res.status(400).json({
      error: "Se requiere entre 1 y 20 IDs."
    });
    return;
  }
  const invalid = ids.filter(id => !UUID_RE.test(id));
  if (invalid.length > 0) {
    res.status(400).json({
      error: `IDs inválidos: ${invalid.join(", ")}`
    });
    return;
  }
  try {
    const result = await _db.default.query("SELECT id, name, category, metadata FROM hardware_components WHERE id = ANY($1::uuid[]) ORDER BY category", [ids]);
    _logger.default.info(`GET /build → ${result.rowCount} productos por ID`);
    res.status(200).json({
      products: result.rows
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno.";
    _logger.default.error(`GET /build falló: ${message}`);
    res.status(500).json({
      error: message
    });
  }
});
var _default = exports.default = router;