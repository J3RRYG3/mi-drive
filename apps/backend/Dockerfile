# ─── Etapa 1: Dependencias ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm install

# ─── Etapa 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules 2>/dev/null || true

COPY . .

WORKDIR /app/apps/backend

# Generar cliente Prisma
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ─── Etapa 3: Runner (mínimo, Cloud Run ready) ────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/backend/.next/standalone ./
COPY --from=builder /app/apps/backend/.next/static ./apps/backend/.next/static
COPY --from=builder /app/apps/backend/public ./apps/backend/public 2>/dev/null || true
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

USER nextjs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "apps/backend/server.js"]
