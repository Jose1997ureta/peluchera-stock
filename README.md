# Peluchera Stock

Inventario web para un negocio de juguetes y peluches: catálogo de productos, actividades de venta (ferias) con cierre de caja, y dashboard de métricas.

Ver [AGENTS.md](AGENTS.md) para el modelo de dominio y las convenciones del proyecto, [docs/LIBRARIES.md](docs/LIBRARIES.md) para el detalle del stack, y `spec/` para las especificaciones de cada feature (ver [.agents/skill/spec/SKILL.md](.agents/skill/spec/SKILL.md)).

## Requisitos

- Node.js `^20.19.0 || >=22.12.0` recomendado (probado también con 20.17.x)
- Cuenta y proyecto de [Supabase](https://supabase.com)

## Setup

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

```bash
npm run dev         # entorno de desarrollo
npm run build        # build de producción
npm run lint          # ESLint
npm run typecheck      # tsc --noEmit
npm run preview        # preview del build
```
