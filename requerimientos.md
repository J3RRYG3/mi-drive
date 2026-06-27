# Especificación Técnica y Requerimientos del Proyecto: miDrive Multicloud

## 1. Visión General para Claude Code
Actúa como un Ingeniero de Software Senior y Arquitecto Cloud. Tu objetivo es desarrollar "miDrive", una plataforma web FullStack de almacenamiento de archivos personales. La aplicación debe ser construida en un entorno monorepo y estar diseñada estrictamente para integrarse con una infraestructura multicloud previamente aprovisionada mediante Terraform. El enfoque principal es la resiliencia multicloud, la optimización de costos (FinOps) y la contenerización modular.

## 2. Stack Tecnológico
* **Lenguaje:** TypeScript (Estricto).
* **Frontend:** React (Vite).
* **Backend:** Next.js (utilizado principalmente para las API Routes y la orquestación del servidor).
* **Gestor de Paquetes/Monorepo:** npm workspaces.
* **Contenerización:** Docker y Docker Compose.

## 3. Arquitectura Local y Simulación de Microprocesos
La aplicación local debe simular la distribución de la infraestructura de producción mediante contenedores separados y redes virtuales. 

### 3.1. Topología de Docker Compose
Deberás crear un archivo `docker-compose.yml` que defina los siguientes servicios y redes:

* **Redes (Networks):**
    * `public_network`: Para el acceso del frontend.
    * `private_backend_network`: Para la comunicación exclusiva entre el frontend, backend y base de datos local.
* **Contenedor 1: Frontend (React)**
    * Expuesto en el puerto 3000.
    * Conectado a `public_network` y `private_backend_network`.
    * Debe comunicarse con el backend a través del nombre de host interno definido en Docker.
* **Contenedor 2: Backend (Next.js)**
    * Expuesto en el puerto 8080 (preparando la imagen para GCP Cloud Run, que utilizará este contenedor en producción).
    * Conectado a `private_backend_network`.
* **Contenedor 3: Base de Datos Local (Simulación de Azure SQL)**
    * Contenedor `mcr.microsoft.com/mssql/server:2019-latest` para simular localmente el motor de Azure SQL Server.
    * Conectado únicamente a `private_backend_network`.

## 4. Estructura del Monorepo
Genera la siguiente estructura base para asegurar el aislamiento de dependencias:

```text
/
├── apps/
│   ├── frontend/       # Aplicación React pura (Vite)
│   │   ├── Dockerfile  # Dockerfile para el Frontend
│   │   └── ...
│   └── backend/        # Aplicación Next.js (API endpoints, orquestación)
│       ├── Dockerfile  # Dockerfile para el Backend (Cloud Run ready, puerto 8080)
│       └── ...
├── packages/           # Tipos compartidos, validaciones, utilidades
├── docker-compose.yml
├── package.json        # Configuración del workspace (npm workspaces)
└── requerimientos.md
```

## 5. Integración con Infraestructura Multicloud (APIs de Proveedores)
El backend debe conectarse a los servicios cloud definidos en nuestra infraestructura Terraform. Implementa los SDKs correspondientes utilizando variables de entorno:

* **Almacenamiento de Objetos (Google Cloud Storage - GCP):**
  * Utiliza la librería `@google-cloud/storage`.
  * Implementa lógica para generar **Signed URLs** (URLs firmadas). El frontend debe subir/descargar archivos directamente al bucket de GCP (`midrive-user-files-${var.gcp_project_id}`) usando estas URLs para no saturar la red del backend (práctica FinOps).
* **Base de Datos Relacional (Azure SQL Database Serverless):**
  * Utiliza el ORM Prisma o Drizzle (o el driver `mssql`).
  * Configura la conexión para la base de datos `midrive-user-db`.
  * **Crucial:** Implementa lógica de reintentos (retry logic) en la conexión. Al ser una base de datos Serverless, puede sufrir arranques en frío (cold starts) por auto-pausa.
* **Gestión de Identidad (Amazon Cognito - AWS):**
  * Utiliza `@aws-sdk/client-cognito-identity-provider`.
  * El registro, inicio de sesión y validación de tokens JWT debe hacerse contra el User Pool de AWS `midrive-user-pool`.

## 6. Variables de Entorno (.env)
Claude, debes crear un archivo `.env.example` en la raíz (y asegurar que `.env` esté en `.gitignore`) que incluya las siguientes variables requeridas por los contenedores, dejando los valores en blanco para que el usuario los llene con los outputs de Terraform:

```env
# GCP (Almacenamiento)
GCP_PROJECT_ID=
GCP_CLIENT_EMAIL=
GCP_PRIVATE_KEY=
GCP_BUCKET_NAME=

# Azure (Base de datos)
AZURE_SQL_SERVER=
AZURE_SQL_DATABASE=midrive-user-db
AZURE_SQL_USER=
AZURE_SQL_PASSWORD=

# AWS (Autenticación)
AWS_REGION=
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=
```

## 7. Pasos de Ejecución Obligatorios para Claude Code
Ejecuta las siguientes tareas de forma secuencial y no te detengas hasta completar la fase 3:

* **Fase 1: Scaffolding e Infraestructura Local:** 
  * Inicializa el monorepo (npm workspaces).
  * Crea las apps base (Frontend React/Vite y Backend Next.js).
  * Genera los dos `Dockerfile` y el `docker-compose.yml` completo con las redes y el contenedor de MSSQL.
* **Fase 2: Conectores Multicloud:** 
  * Instala los SDKs de AWS, Azure y GCP en el backend.
  * Crea los archivos de configuración de clientes para Cognito, Azure SQL y GCP Storage.
* **Fase 3: Desarrollo de Features:** 
  * Crea los endpoints en Next.js para Login (Cognito) y Generación de Signed URLs (GCP).
  * Crea la UI básica en React para hacer Login y un botón para subir un archivo.