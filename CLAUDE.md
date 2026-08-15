# CLAUDE.md

Este archivo es la guía específica para Claude Code en este repositorio. Las reglas de dominio, stack y convenciones completas están en [AGENTS.md](AGENTS.md) — léelo siempre primero, es la fuente de verdad. Este archivo solo agrega lo específico del flujo de trabajo con Claude Code.

## Resumen ultra-rápido

Peluchera Stock: inventario web (React + TypeScript + Tailwind + beUI) con backend en Supabase, para gestionar productos (juguetes/peluches) y "actividades" de venta (ferias) con cierre de caja y dashboard de métricas. Detalle completo del modelo de negocio en [AGENTS.md](AGENTS.md).

## Comandos (actualizar esta sección apenas se agregue el `package.json`)

```bash
npm install        # instalar dependencias
npm run dev         # entorno de desarrollo (Vite)
npm run build        # build de producción
npm run lint          # ESLint
npm run typecheck      # tsc --noEmit
```

No asumir que existen otros scripts (tests, storybook, etc.) hasta confirmarlo en `package.json`.

## Antes de escribir código

- Revisar si ya existe una feature similar en `src/features/` antes de crear una nueva carpeta o patrón.
- Los componentes de `src/shared/components/ui/` vienen de beUI. **Siempre que se necesite un componente de UI, usar primero el MCP de beUI** (`list_components`, `search_components`, `get_component`, `get_install_command`) para buscarlo e instalarlo — no reinventarlo a mano ni escribirlo desde cero. Si el MCP no está disponible en la sesión, usar como respaldo el CLI de shadcn (`npx shadcn add <componente>` o `npx shadcn add @beui/<componente>`), y migrar al MCP en cuanto esté disponible.
- Cualquier lógica que toque `stock` de productos o el cierre de una `activity` debe seguir exactamente las reglas de la sección 3 de [AGENTS.md](AGENTS.md) (descuento por `sold_qty`, no por `initial_qty`; operación atómica al cerrar).
- Los schemas de Yup son la única fuente de verdad de validación de formularios — no dupliques reglas de validación dentro del JSX de un componente Formik.

## Después de un cambio de UI

Si hay un dev server corriendo, verificar el cambio en el navegador (Base flujo: crear/editar producto, agregar producto a una actividad, cerrar actividad) antes de reportar la tarea como terminada, en vez de asumir que compila y ya funciona.

## Qué NO hacer sin que el usuario lo pida

- No agregar Redux/Zustand/otra librería de estado global — TanStack Query + contexto local alcanza para este alcance.
- No agregar roles ni permisos diferenciados — el sistema es multi-usuario pero todos con el mismo nivel de acceso (ver sección 1 de [AGENTS.md](AGENTS.md)).
- No agregar estados de actividad más allá de `open`/`closed`.
- No agregar campos que no estén en el modelo de datos de [AGENTS.md](AGENTS.md) (ej. costo/margen) sin confirmarlo antes.
