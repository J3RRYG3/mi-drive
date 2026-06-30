# ─── Etapa 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos del monorepo
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Instalar todas las dependencias del workspace
RUN npm install

# Copiar código fuente
COPY apps/frontend/ ./apps/frontend/
COPY packages/shared/ ./packages/shared/

# Build de producción
WORKDIR /app/apps/frontend
RUN npm run build

# ─── Etapa 2: Servir con Nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
