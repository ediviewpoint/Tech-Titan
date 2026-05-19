# ══════════════════════════════════════════════════════════════════
# Tech-Titan Backend — Express puro :: Multi-stage build
# ══════════════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json .
COPY src/ ./src/

RUN npm run build
RUN npm prune --production

# ── Stage 2: Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache wget

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app
USER appuser

EXPOSE 9000

HEALTHCHECK \
  --interval=30s  \
  --timeout=10s   \
  --start-period=20s \
  --retries=3     \
  CMD wget -qO- http://localhost:9000/health || exit 1

CMD ["node", "dist/server.js"]
