# CLAUDE.md — Memoria del Proyecto miDrive

## Visión General
Plataforma web FullStack de almacenamiento de archivos personales multicloud.
Arquitectura monorepo contenerizada, integrada con AWS Cognito (auth), GCP Storage (archivos) y Azure SQL Serverless (base de datos).

## Stack Tecnológico
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Next.js 14 (API Routes) + TypeScript |
| Auth | AWS Cognito (SDK v3) |
| Storage | Google Cloud Storage + Signed URLs |
| DB | Azure SQL Serverless (Prisma ORM) |
| Monorepo | npm workspaces |
| Contenedores | Docker + Docker Compose |
| UI | Tailwind CSS + shadcn/ui |

## Estructura del Monorepo
```
/
├── apps/
│   ├── frontend/     # React + Vite, puerto 3000
│   └── backend/      # Next.js, puerto 8080 (Cloud Run ready)
├── packages/
│   └── shared/       # Tipos TypeScript compartidos
├── docker-compose.yml
├── package.json      # npm workspaces root
├── .env.example
└── requerimientos.md
```

## Topología Docker Compose
- **public_network**: acceso externo → frontend
- **private_backend_network**: comunicación interna → frontend ↔ backend ↔ db

| Contenedor | Puerto | Redes |
|---|---|---|
| frontend | 3000 | public_network + private_backend_network |
| backend | 8080 | private_backend_network |
| db (MSSQL) | 1433 | private_backend_network |

## Variables de Entorno Clave
Ver `.env.example` en la raíz. Los valores los provee el usuario desde outputs de Terraform.

## Decisiones Arquitectónicas
1. **Signed URLs para GCP**: El frontend sube/descarga directamente al bucket sin pasar por el backend → práctica FinOps para reducir egress de red.
2. **Prisma + retry logic**: Azure SQL Serverless tiene cold starts (auto-pausa). Se implementa retry exponencial en la conexión.
3. **Next.js en puerto 8080**: Preparado para despliegue en GCP Cloud Run que espera este puerto por convención.
4. **Cognito JWT validation**: El backend valida JWTs de Cognito en cada request protegido usando `aws-jwt-verify`.
5. **MSSQL local**: `mcr.microsoft.com/mssql/server:2019-latest` como simulación del Azure SQL Server.

## Comandos Útiles
```bash
# Desarrollo local (con Docker)
docker compose up --build

# Instalar dependencias del monorepo
npm install

# Correr frontend en dev
npm run dev -w apps/frontend

# Correr backend en dev
npm run dev -w apps/backend

# Ver logs de contenedores
docker compose logs -f
```

## Estado de la Construcción
- [x] CLAUDE.md creado
- [x] Fase 1: Scaffolding e infraestructura local (monorepo, Dockerfiles, docker-compose)
- [x] Fase 2: Conectores multicloud (Cognito, GCP Storage, Prisma + Azure SQL)
- [x] Fase 3: Features (endpoints Login + Signed URLs + UI React completa)
- [x] Push al repositorio remoto (commit: `feat: scaffolding inicial`)

## Próximos pasos para el usuario
1. Copiar `.env.example` → `.env` y rellenar con outputs de Terraform
2. Ejecutar `docker compose up --build` desde la raíz del proyecto
3. Acceder a http://localhost:3000 para ver el frontend

## Repositorio Remoto
`https://github.com/J3RRYG3/mi-drive.git`
