# Finanzas del Hogar

Aplicación responsive para registrar ingresos y gastos del hogar, consultar el balance mensual y entender la distribución de gastos por categoría.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finanzas-hogar/src/App.tsx` — dashboard, formulario de movimientos, filtros y persistencia local.
- `artifacts/finanzas-hogar/src/index.css` — sistema visual, tipografía, responsive y animaciones.
- `artifacts/finanzas-hogar` — aplicación web principal servida en la ruta raíz.

## Architecture decisions

- La primera versión es local-first: los movimientos se serializan en `localStorage` para conservarlos después de recargar.
- El dashboard filtra y calcula los totales en el cliente para mantener una experiencia rápida y usable sin conexión.
- Los datos de ejemplo solo se cargan cuando no existe todavía una colección guardada.

## Product

- Resumen mensual de ingresos, gastos, balance y tasa de ahorro.
- Distribución interactiva de gastos por categoría.
- Registro de ingresos y gastos con categorías dinámicas, fecha y validación.
- Historial con búsqueda, filtro por categoría y eliminación confirmada.

## User preferences

- Interfaz en español.
- Formato local `es-DO` para monedas y fechas.

## Gotchas

- No borrar la clave `finanzas-hogar:transactions` de `localStorage` salvo que se quiera reiniciar intencionalmente la demo.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
