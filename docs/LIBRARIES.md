# Librerías del proyecto

Documento de referencia con las librerías core del stack, versiones recomendadas al día de hoy (agosto 2026), para qué se usa cada una en Peluchera Stock, y cómo se instalan. Actualizar este archivo cada vez que se agregue o cambie una dependencia importante.

## Core

### React
- **Versión recomendada:** `19.2.x` (última: `19.2.8`)
- **Para qué se usa:** librería de UI base de toda la app.
- **Por qué esta versión:** beUI (nuestra librería de componentes) requiere React 19 explícitamente.
- **Instalación:** `npm install react@^19.2.0 react-dom@^19.2.0`
- Docs: https://react.dev

### TypeScript
- **Versión recomendada:** `5.9.x` (última de la serie 5.x: `5.9.3`), **no** la `7.0` todavía.
- **Para qué se usa:** tipado estático de todo el código.
- **Por qué esta versión y no la 7.0:** TypeScript 7.0 (compilador nativo en Go) se acaba de liberar (principios de agosto 2026) y es un cambio de fundación muy reciente; herramientas del ecosistema (Vite, ESLint, plugins) todavía están migrando compatibilidad. Para no arriesgar el arranque del proyecto, usamos la última 5.x, estable y 100% soportada por Vite/ESLint. Se puede reevaluar el salto a 7.0 más adelante cuando el ecosistema esté maduro.
- **Instalación:** `npm install -D typescript@^5.9.3`
- Docs: https://www.typescriptlang.org

## Formularios y validación

### Formik
- **Versión recomendada:** `2.4.x` (última: `2.4.9`)
- **Para qué se usa:** manejo de estado, submit y errores de todos los formularios (crear/editar producto, crear actividad, registrar vendidos, login, perfil).
- **Instalación:** `npm install formik`
- Docs: https://formik.org/docs/overview

### Yup
- **Versión recomendada:** `1.7.x` (última: `1.7.1`)
- **Para qué se usa:** definición de los schemas de validación que usa Formik (`validationSchema`). Es la única fuente de verdad de las reglas de cada formulario (requerido, mínimos, formatos, etc.), como se define en [AGENTS.md](../AGENTS.md).
- **Instalación:** `npm install yup`
- Docs: https://github.com/jquense/yup

## Backend / datos

### Supabase (`@supabase/supabase-js`)
- **Versión recomendada:** `2.112.x` (última: `2.112.3`)
- **Para qué se usa:** cliente único para Postgres (productos, actividades), Auth (login single-user) y Storage (imágenes de producto).
- **Instalación:** `npm install @supabase/supabase-js`
- Docs: https://supabase.com/docs/reference/javascript/installing
- Nota: usar únicamente la `anon key` en el cliente, protegida con RLS (ver sección 6 de [AGENTS.md](../AGENTS.md)). Los tipos de las tablas se generan con la Supabase CLI: `npx supabase gen types typescript --project-id <id> > src/shared/types/database.ts`.

## UI

### beUI
- **Versión:** no es un paquete de npm versionado — se distribuye componente por componente vía el registro de shadcn. El código se copia a `src/shared/components/ui/` y queda 100% editable en el repo.
- **Requisitos:** React 19 + Tailwind CSS 4 (obligatorio, la librería no funciona con Tailwind 3).
- **Para qué se usa:** componentes de UI con animaciones (Motion/Framer Motion) — botones, cards, inputs, modales, etc.
- **Instalación — MCP de beUI (obligatorio, usar siempre primero):** beUI expone un MCP server pensado para agentes de código, con las tools `list_components`, `search_components`, `get_component` y `get_install_command`. Cualquier agente (Claude Code u otro) debe usarlo para buscar e instalar componentes antes de recurrir a cualquier otra vía.
  - Alta del MCP (una sola vez por máquina/proyecto, ejecutar en una terminal):
    ```bash
    claude mcp add --transport http beui https://mcp.beui.dev/mcp
    ```
  - Requiere iniciar una sesión nueva de Claude Code después de agregarlo para que quede disponible (las sesiones ya abiertas no lo detectan en caliente).
- **Instalación — respaldo vía CLI de shadcn (solo si el MCP no está disponible en la sesión):**
  ```bash
  npx shadcn add @beui/<nombre-del-componente>
  ```
  (también funciona con `pnpm dlx`, `yarn dlx` o `bunx --bun` si se cambia de gestor de paquetes). Si el componente no existe en el registro `@beui/` (ej. primitivos base como Button/Input/Card), instalar directamente el nombre sin prefijo (`npx shadcn add button`), ya que esos vienen del registro base de shadcn/Base UI sobre el que beUI construye sus componentes animados.
- Sitio: https://beui.dev — catálogo de componentes en https://beui.dev/components/motion
- Repo fuente: https://github.com/starc007/ui-components
- Nota: la web de beUI está pensada para Next.js, pero al distribuirse vía CLI de shadcn (que sí soporta Vite), funciona igual en nuestro proyecto Vite + React siempre que Tailwind 4 esté configurado primero.

### Tailwind CSS
- **Versión recomendada:** `4.x`
- **Para qué se usa:** utilidades de estilos, requerido por beUI.
- **Instalación (con Vite):**
  ```bash
  npm install tailwindcss @tailwindcss/vite
  ```
  y agregar el plugin en `vite.config.ts` + `@import "tailwindcss";` en el CSS global. Sin `postcss.config` manual, Tailwind 4 no lo necesita.
- Docs: https://tailwindcss.com/docs/guides/vite

## Recomendaciones adicionales (confirmadas por el usuario)

| Librería | Para qué | Estado |
|---|---|---|
| **Vite** | bundler/dev server del proyecto | Confirmado — ya scaffoldeado |
| **react-router-dom** (v7) | rutas: `/productos`, `/actividades`, `/actividades/:id`, `/dashboard`, `/perfil` | Confirmado |
| **@tanstack/react-query** (v5) | cachear y sincronizar las llamadas a Supabase (listas de productos, actividades, mutaciones), evita reinventar loading/error/refetch a mano | Confirmado |
| **lucide-react** | íconos — es la librería de íconos que usan los componentes de beUI/shadcn por defecto | Confirmado |
| **clsx** + **tailwind-merge** | combinar clases de Tailwind condicionalmente sin choques (lo usan casi todos los componentes de shadcn/beUI) | Confirmado |
| **sonner** | notificaciones tipo "toast" (ej. "Producto creado", "Actividad cerrada") — es el estándar en componentes shadcn-like | Confirmado |
| **ESLint + Prettier** | calidad y formato de código consistente | Confirmado |
| **date-fns** | formateo de fechas (creación de actividad, cierre, filtros por mes en el dashboard) | Confirmado |
| **recharts** | gráficos del dashboard (ventas del mes, ranking de actividades) | Confirmado |
