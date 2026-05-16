"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _winston = _interopRequireDefault(require("winston"));
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const LOGS_DIR = _path.default.join(process.cwd(), "logs");
if (!_fs.default.existsSync(LOGS_DIR)) {
  _fs.default.mkdirSync(LOGS_DIR, {
    recursive: true
  });
}
const {
  combine,
  timestamp,
  colorize,
  printf,
  errors,
  splat
} = _winston.default.format;
const LINE = printf(({
  level,
  message,
  timestamp: ts,
  stack
}) => `${ts} [${level}]: ${stack ?? message}`);
const logger = _winston.default.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  // ── Transport 1: consola coloreada ──────────────────────────────────────
  transports: [new _winston.default.transports.Console({
    format: combine(colorize({
      all: true
    }), errors({
      stack: true
    }), splat(), timestamp({
      format: "HH:mm:ss"
    }), LINE)
  }),
  // ── Transport 2: archivo solo errores críticos ───────────────────────
  new _winston.default.transports.File({
    filename: _path.default.join(LOGS_DIR, "error.log"),
    level: "error",
    format: combine(errors({
      stack: true
    }), splat(), timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }), LINE),
    maxsize: 5 * 1024 * 1024,
    // 5 MB por archivo
    maxFiles: 3
  })]
});
var _default = exports.default = logger;