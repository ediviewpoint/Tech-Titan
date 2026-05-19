import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import logger from "./lib/logger";
import apiRouter from "./api/index";

const app  = express();
const PORT = Number(process.env.PORT ?? 9000);

const allowedOrigins = [
  process.env.STORE_CORS ?? "http://localhost:3000",
  process.env.ADMIN_CORS ?? "http://localhost:7001",
].flatMap((s) => s.split(",").map((u) => u.trim()));

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Performance ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             300,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { error: "Demasiadas solicitudes. Intenta en 15 minutos." },
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString(), env: process.env.NODE_ENV ?? "development" });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/", apiRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  logger.error(`Unhandled error: ${message}`);
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  logger.info(`Tech-Titan API escuchando en http://localhost:${PORT}`);
});

export default app;
