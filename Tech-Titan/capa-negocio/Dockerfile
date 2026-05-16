# ══════════════════════════════════════════════════════════════════
# Tech-Titan — Backend MedusaJS v1 :: Production Docker Image
# Multi-stage build: Builder → Runner
# ══════════════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"

# Build tools needed for native Node modules (bcrypt, pg-native, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install ALL dependencies (dev + prod) for the TypeScript build
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Compile TypeScript src/ → dist/
RUN npm run build

# Remove dev dependencies — keeps compiled native binaries intact
RUN npm prune --production --legacy-peer-deps

# ── Stage 2: Production runner ────────────────────────────────────
FROM node:20-alpine AS runner

LABEL maintainer="Tech-Titan <ops@techtitan.dev>"
LABEL description="MedusaJS v1 Backend — PC Builder Compatibility Engine"

# wget for the HEALTHCHECK command
RUN apk add --no-cache wget

WORKDIR /app

# Runtime environment
ENV NODE_ENV=production
ENV PORT=9000

# Copy production-pruned node_modules + compiled output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

# Runtime config files
COPY medusa-config.js  .
COPY scripts/          ./scripts/

# Re-apply TypeORM patch on the production node_modules
# (patch-medusa.js is idempotent — safe to run multiple times)
RUN node scripts/patch-medusa.js

# ── Security: non-root user ───────────────────────────────────────
RUN addgroup -S medusa && adduser -S medusa -G medusa
RUN chown -R medusa:medusa /app
USER medusa

# ── Networking ───────────────────────────────────────────────────
EXPOSE 9000

# ── Health check ─────────────────────────────────────────────────
# start-period=90s gives MedusaJS time to run migrations on first boot
HEALTHCHECK \
  --interval=30s  \
  --timeout=10s   \
  --start-period=90s \
  --retries=3     \
  CMD wget -qO- http://localhost:9000/health || exit 1

# ── Startup sequence ─────────────────────────────────────────────
# 1. Run pending database migrations (idempotent, safe on every boot)
# 2. Start the production server
CMD ["sh", "-c", \
  "node_modules/.bin/medusa migrations run && \
   node_modules/.bin/medusa start"]
