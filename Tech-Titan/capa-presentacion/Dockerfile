# ══════════════════════════════════════════════════════════════════
# Tech-Titan Frontend — Next.js standalone :: Multi-stage build
# ══════════════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

# Build args para variables públicas necesarias en build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER

RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache wget

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Archivos generados por output: standalone
COPY --from=builder --chown=appuser:appgroup /app/public                  ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone        ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static            ./.next/static

USER appuser

EXPOSE 3000

HEALTHCHECK \
  --interval=30s  \
  --timeout=10s   \
  --start-period=30s \
  --retries=3     \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
