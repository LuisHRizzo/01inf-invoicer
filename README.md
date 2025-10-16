<div align="center">

# Generador de Facturas Pro

Aplicación full-stack para crear, administrar y exportar facturas en PDF con gestión de clientes y catálogo de servicios/productos.

</div>

## Características

- Generación y edición de facturas con cálculo automático de subtotal, impuestos y total.
- Gestión de clientes y servicios con búsqueda y validaciones de datos.
- Vista previa optimizada para impresión y exportación a PDF basada en pdfmake.
- Sincronización en tiempo real con un backend Express + PostgreSQL.
- Despliegue simplificado con Docker (frontend, backend y base de datos).

## Arquitectura

- **Frontend**: React 19 + Vite, componentes en `components/`, utilidades de generación PDF en `utils/`.
- **Backend**: API REST en Express (`backend/server.ts`) con acceso a PostgreSQL mediante `pg`.
- **Base de datos**: esquema relacional definido en `backend/schema/schema.sql` con datos de ejemplo en `backend/dump_data.sql`.
- **Exportación PDF**: definición de documentos en `utils/pdfDefinition.ts` usando pdfmake.

## Requisitos previos

- Node.js >= 20 y pnpm (se instala automáticamente en Dockerfiles, pero se recomienda `npm install -g pnpm` en local).
- PostgreSQL >= 14 (local o en contenedor).
- Docker y Docker Compose opcionales para la ejecución contenerizada.

## Variables de entorno

| Entorno | Archivo | Clave | Propósito |
|---------|---------|-------|-----------|
| Frontend | `.env` | `VITE_API_BASE_URL` | URL base del backend para las llamadas desde el navegador. |
| Frontend | `.env` | `VITE_APP_BACKEND_URL` | URL base del backend usada internamente por la aplicación. |
| Backend | `backend/.env` | `DATABASE_URL` | Cadena de conexión a PostgreSQL. |
| Backend | `backend/.env` | `PORT` | Puerto de escucha de la API (por defecto 3001). |

> Copia los archivos `.env` incluidos y ajusta los valores según tu entorno.

## Puesta en marcha (entorno local)

1. Instalar dependencias del frontend:
   ```bash
   pnpm install
   ```
2. Instalar dependencias del backend:
   ```bash
   cd backend
   pnpm install
   cd ..
   ```
3. Preparar la base de datos PostgreSQL:
   - Crear una base de datos llamada `invoices`.
   - Ejecutar el esquema: `psql -d invoices -f backend/schema/schema.sql`.
   - (Opcional) Cargar datos de ejemplo: `psql -d invoices -f backend/dump_data.sql`.
4. Lanzar el backend:
   ```bash
   pnpm --dir backend dev
   ```
5. Iniciar el frontend en otra terminal:
   ```bash
   pnpm dev
   ```
6. Abrir `http://localhost:5173` en el navegador (el puerto puede variar según el mensaje de Vite).

## Scripts disponibles

- Frontend:
  - `pnpm dev`: servidor de desarrollo con Vite.
  - `pnpm build`: compilación para producción.
  - `pnpm preview`: servidor local para revisar la build.
- Backend:
  - `pnpm dev`: backend en modo desarrollo con recarga (`ts-node-dev`).
  - `pnpm start`: arranque en modo producción (`ts-node`).

## Uso básico

1. Desde la vista de facturas, pulsa **Nueva factura** para generar un borrador.
2. Selecciona un cliente existente o crea uno nuevo. Puedes buscar por nombre, dirección, email o NIF.
3. Añade partidas desde el catálogo de servicios/productos o crea nuevas con precio y categoría.
4. Ajusta impuestos, fechas y notas; la aplicación recalcula subtotal, impuestos y total automáticamente.
5. Guarda la factura para persistirla en la base de datos.
6. Utiliza la opción de exportar para generar un PDF descargable o listo para imprimir.

## Ejecución con Docker

La raíz del proyecto incluye un `docker-compose.yml` que levanta PostgreSQL, backend y frontend:

```bash
docker compose up -d
```

- La base de datos se inicializa con `backend/dump_schema.sql`.
- El backend expone `http://localhost:3001`.
- El frontend se sirve en `http://localhost:4173`.

> Asegúrate de que los puertos 5432, 3001 y 4173 estén libres antes de ejecutar el comando.

## Estructura del proyecto

```
.
├── App.tsx                 # Vista principal del frontend
├── components/             # Componentes UI (formularios, modales, vistas de impresión)
├── utils/pdfDefinition.ts  # Definición del PDF para pdfmake
├── backend/
│   ├── server.ts           # API REST con Express
│   ├── db.ts               # Pool de conexión a PostgreSQL
│   ├── schema/schema.sql   # Esquema de la base de datos
│   └── dump_data.sql       # Datos de ejemplo
└── docker-compose.yml      # Orquestación de servicios en contenedores
```

## Pruebas y calidad

- Actualmente no se incluyen suites automatizadas. Se recomienda validar manualmente la creación y edición de facturas tras cualquier cambio relevante.
- Antes de desplegar, ejecuta `pnpm build` en el frontend para asegurar que la compilación se realiza sin errores.

## Siguientes pasos sugeridos

- Añadir pruebas unitarias para utilidades clave (`utils/pdfDefinition.ts`, cálculos de totales).
- Incorporar autenticación si la aplicación se expone públicamente.
- Automatizar migraciones con herramientas como Prisma Migrate o Knex.
