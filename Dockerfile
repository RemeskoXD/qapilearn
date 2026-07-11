# syntax=docker/dockerfile:1.6

# ──────────────────────────────────────────────────────────────────────────────
# Q-Hub – production Docker image
# Jeden kontejner servíruje:
#   • REST API na /api/*
#   • SPA frontend (Vite build z dist/) na všem ostatním
# ──────────────────────────────────────────────────────────────────────────────

# ---- Stage 1: deps (cache npm install) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/prisma ./server/prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---- Stage 2: build (Vite frontend + Prisma client) ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Vygeneruje @prisma/client do node_modules
RUN npx prisma generate --schema server/prisma/schema.prisma
# Sestaví Vite -> /app/dist
RUN npm run build

# ---- Stage 3: runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Kopírujeme jen to, co je potřeba pro běh.
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist          ./dist
COPY --from=build /app/server        ./server
COPY package.json ./

# Prisma engine binaries do production image (z build stage).
COPY --from=build /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma  ./node_modules/@prisma

EXPOSE 3000

# Healthcheck pro Coolify / reverse proxy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

# Spuštění:
#   1) prisma db push  -> vytvoří/aktualizuje qhub_* tabulky
#   2) node server     -> Express servíruje API + SPA
CMD ["npm", "run", "start"]
