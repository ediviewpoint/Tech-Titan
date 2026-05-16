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

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateBuildSchema = _zod.z.object({
  userId: _zod.z.string().min(1),
  userEmail: _zod.z.string().email(),
  buildName: _zod.z.string().min(1).max(100),
  components: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
  totalPrice: _zod.z.number().nonnegative().int(),
  totalTdp: _zod.z.number().nonnegative().int(),
  isValid: _zod.z.boolean()
});

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── GET /store/user-builds?userId=xxx ───────────────────────────────────────

router.get("/", async (req, res) => {
  const userId = typeof req.query["userId"] === "string" ? req.query["userId"] : undefined;
  if (!userId) {
    res.status(400).json({
      error: "Parámetro 'userId' es requerido"
    });
    return;
  }
  try {
    const result = await _db.default.query("SELECT * FROM user_builds WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    _logger.default.info(`GET /user-builds → ${result.rowCount} builds para userId: ${userId}`);
    res.status(200).json({
      builds: result.rows
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    _logger.default.error(`GET /user-builds error: ${msg}`);
    res.status(500).json({
      error: msg
    });
  }
});

// ─── POST /store/user-builds ─────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const parsed = CreateBuildSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Datos inválidos",
      details: parsed.error.flatten().fieldErrors
    });
    return;
  }
  const {
    userId,
    userEmail,
    buildName,
    components,
    totalPrice,
    totalTdp,
    isValid
  } = parsed.data;
  try {
    const result = await _db.default.query(`INSERT INTO user_builds (user_id, user_email, build_name, components, total_price, total_tdp, is_valid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`, [userId, userEmail, buildName, JSON.stringify(components), totalPrice, totalTdp, isValid]);
    _logger.default.info(`POST /user-builds → "${buildName}" para ${userEmail} [${result.rows[0].id}]`);
    res.status(201).json({
      id: result.rows[0].id,
      buildName
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    _logger.default.error(`POST /user-builds error: ${msg}`);
    res.status(500).json({
      error: msg
    });
  }
});

// ─── DELETE /store/user-builds/:id ───────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  const {
    id
  } = req.params;
  try {
    await _db.default.query("DELETE FROM user_builds WHERE id = $1", [id]);
    _logger.default.info(`DELETE /user-builds/${id}`);
    res.status(200).json({
      success: true
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    _logger.default.error(`DELETE /user-builds error: ${msg}`);
    res.status(500).json({
      error: msg
    });
  }
});
var _default = exports.default = router;