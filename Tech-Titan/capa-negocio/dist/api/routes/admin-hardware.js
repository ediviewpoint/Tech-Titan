"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = require("express");
var _zod = require("zod");
var _db = _interopRequireDefault(require("../../lib/db"));
var _logger = _interopRequireDefault(require("../../lib/logger"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = (0, _express.Router)();

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const CreateHardwareSchema = _zod.z.object({
  name: _zod.z.string().min(2).max(255),
  category: _zod.z.enum(["CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage"]),
  metadata: _zod.z.object({
    socket_type: _zod.z.enum(["AM4", "AM5", "LGA1700", "LGA1200"]).optional(),
    form_factor: _zod.z.enum(["ATX", "MATX", "ITX"]).optional(),
    ram_generation: _zod.z.enum(["DDR4", "DDR5"]).optional(),
    tdp_watts: _zod.z.number().nonnegative().optional(),
    wattage_watts: _zod.z.number().positive().optional()
  }).optional().default({})
});

// ─── POST /store/admin/hardware ───────────────────────────────────────────────

router.post("/", async (req, res) => {
  const parsed = CreateHardwareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Datos inválidos",
      details: parsed.error.flatten().fieldErrors
    });
    return;
  }
  const {
    name,
    category,
    metadata
  } = parsed.data;
  try {
    const result = await _db.default.query(`INSERT INTO hardware_components (name, category, metadata)
       VALUES ($1, $2, $3)
       RETURNING id`, [name, category, JSON.stringify(metadata)]);
    _logger.default.info(`[admin] POST /hardware → creado: "${name}" (${category}) id: ${result.rows[0].id}`);
    res.status(201).json({
      id: result.rows[0].id,
      name,
      category,
      metadata
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno.";
    // Unique constraint violation → nombre duplicado
    if (message.includes("unique") || message.includes("duplicate")) {
      res.status(409).json({
        error: `Ya existe un componente llamado "${name}"`
      });
      return;
    }
    _logger.default.error(`[admin] POST /hardware falló: ${message}`);
    res.status(500).json({
      error: message
    });
  }
});

// ─── DELETE /store/admin/hardware/:id ────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.delete("/:id", async (req, res) => {
  const {
    id
  } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({
      error: "ID inválido (debe ser UUID v4)."
    });
    return;
  }
  try {
    const result = await _db.default.query("DELETE FROM hardware_components WHERE id = $1 RETURNING id, name", [id]);
    if (result.rowCount === 0) {
      res.status(404).json({
        error: `Componente ${id} no encontrado.`
      });
      return;
    }
    const {
      name
    } = result.rows[0];
    _logger.default.info(`[admin] DELETE /hardware/${id} → eliminado: "${name}"`);
    res.status(200).json({
      deleted: true,
      id,
      name
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno.";
    _logger.default.error(`[admin] DELETE /hardware/${id} falló: ${message}`);
    res.status(500).json({
      error: message
    });
  }
});
var _default = exports.default = router;