import winston from "winston";
import path from "path";
import fs from "fs";

const LOGS_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const { combine, timestamp, colorize, printf, errors, splat } = winston.format;

const LINE = printf(({ level, message, timestamp: ts, stack }) =>
  `${ts} [${level}]: ${(stack as string | undefined) ?? message}`
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",

  // ── Transport 1: consola coloreada ──────────────────────────────────────
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        splat(),
        timestamp({ format: "HH:mm:ss" }),
        LINE
      ),
    }),

    // ── Transport 2: archivo solo errores críticos ───────────────────────
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "error.log"),
      level: "error",
      format: combine(
        errors({ stack: true }),
        splat(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        LINE
      ),
      maxsize: 5 * 1024 * 1024, // 5 MB por archivo
      maxFiles: 3,
    }),
  ],
});

export default logger;
