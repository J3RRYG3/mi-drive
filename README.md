# miDrive — Plataforma de almacenamiento multicloud

Monorepo con frontend React + Vite y backend Next.js, desplegado en GCP Cloud Run con autenticación AWS Cognito, almacenamiento GCP Cloud Storage y base de datos Azure SQL Serverless.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript → Nginx (Cloud Run) |
| Backend | Next.js 14 standalone + TypeScript (Cloud Run, puerto 8080) |
| Auth | AWS Cognito |
| Storage | Google Cloud Storage (Signed URLs) |
| Base de datos | Azure SQL Serverless (Prisma ORM) |
| CI/CD | GitHub Actions → Docker Hub → GCP Cloud Run |

## Desarrollo local

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Rellenar .env con los valores de Terraform (ver sección Variables)

# 2. Levantar todo
docker compose up --build

# 3. Acceder
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080/api/health
```

## CI/CD — GitHub Actions

El pipeline en `.github/workflows/ci-cd.yml` ejecuta 4 jobs en cadena en cada push a `main`:

```
ci (lint + build) → migrate (Prisma) → deploy-backend → deploy-frontend
```

### Prerequisito: migraciones Prisma

Antes del primer push a `main`, generar la migración inicial con el SQL Server local:

```bash
docker compose up db -d
# esperar ~60s a que SQL Server arranque
cd apps/backend
# Windows PowerShell:
$env:DATABASE_URL = 'sqlserver://localhost:1433;database=midrive-user-db;user=sa;password=<AZURE_SQL_PASSWORD>;encrypt=false;trustServerCertificate=true'
npx prisma migrate dev --name init
# Commitear el directorio generado:
git add prisma/migrations/
```

### Secrets de GitHub Actions

Configurar en: `https://github.com/<usuario>/mi-drive` → Settings → Secrets and variables → Actions

#### Docker Hub

| Secret | Descripción |
|---|---|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Access token (hub.docker.com → Account Settings → Security → New Access Token) |

#### GCP (Google Cloud Platform)

| Secret | Descripción | Fuente |
|---|---|---|
| `GCP_SERVICE_ACCOUNT_KEY` | JSON completo del service account | `gcloud iam service-accounts keys create key.json --iam-account=unir-exercise@unir-481719.iam.gserviceaccount.com` |
| `GCP_PROJECT_ID` | ID del proyecto GCP | Output Terraform / `.env` |
| `GCP_CLIENT_EMAIL` | Email del service account | Campo `client_email` del JSON |
| `GCP_PRIVATE_KEY` | Clave RSA privada del service account | Campo `private_key` del JSON — almacenar con `\n` literales, no saltos de línea reales |
| `GCP_BUCKET_NAME` | Nombre del bucket de archivos | Output Terraform / `.env` |

#### Azure SQL

| Secret | Descripción | Valor de referencia |
|---|---|---|
| `AZURE_SQL_SERVER` | Host del servidor SQL | `midrive-sql-server.database.windows.net` |
| `AZURE_SQL_DATABASE` | Nombre de la base de datos | `midrive-user-db` |
| `AZURE_SQL_USER` | Usuario administrador | Output Terraform |
| `AZURE_SQL_PASSWORD` | Contraseña administrador | Output Terraform |
| `DATABASE_URL` | Connection string completa para Prisma | Ver formato abajo |

**Formato de `DATABASE_URL` para producción (Azure SQL):**
```
sqlserver://midrive-sql-server.database.windows.net:1433;database=midrive-user-db;user=<AZURE_SQL_USER>;password=<AZURE_SQL_PASSWORD>;encrypt=true;trustServerCertificate=false;loginTimeout=30
```

#### AWS Cognito

| Secret | Descripción | Valor de referencia |
|---|---|---|
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `AWS_COGNITO_USER_POOL_ID` | ID del User Pool | Output Terraform |
| `AWS_COGNITO_CLIENT_ID` | ID del App Client | Output Terraform |

### Servicios desplegados por el pipeline

| Servicio | Cloud Run | Docker Hub |
|---|---|---|
| Backend | `midrive-app-service` (us-central1) | `<DOCKERHUB_USERNAME>/midrive-backend` |
| Frontend | `midrive-frontend-service` (us-central1) | `<DOCKERHUB_USERNAME>/midrive-frontend` |

> Las imágenes de Docker Hub deben ser **públicas** para que Cloud Run pueda hacer pull sin autenticación adicional.

### Post-deploy

Después del primer deploy exitoso, actualizar el origen de CloudFront (`d3pac4d66l8e2v.cloudfront.net`) para que apunte a la URL de `midrive-frontend-service` en lugar del backend.

## Variables de entorno (.env)

Ver `.env.example` para la lista completa. Los valores se obtienen de los outputs de Terraform en `infra-tfm/`.

## Estructura del monorepo

```
/
├── apps/
│   ├── frontend/          # React + Vite → nginx:alpine, puerto 3000
│   └── backend/           # Next.js 14 standalone, puerto 8080
├── packages/
│   └── shared/            # Tipos TypeScript compartidos
├── .github/workflows/
│   └── ci-cd.yml          # Pipeline CI/CD
├── docker-compose.yml     # Entorno local completo
└── .env.example           # Plantilla de variables de entorno
```
