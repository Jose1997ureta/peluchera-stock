# Dashboard Feature

## Versión
v0-objective-draft

## Objetivo
Dar a la app un shell de navegación único (sidebar animado de beUI) que envuelva todas las rutas protegidas y sirva de punto de partida visual para el resto de las pantallas, y dentro de ese shell, mostrar en la ruta `/` un dashboard con las métricas clave del negocio (ventas del mes, actividad más rentable, productos con stock bajo).

## Alcance objetivo

### Shell de navegación (Animated Sidebar)
- Se usa el componente `animated-sidebar` de beUI (instalado vía su MCP) como único mecanismo de navegación principal de la app — no se combina con `Dock` ni con otro patrón de navegación en esta versión.
- Vive en `src/app/` (layout de la app, no es parte de ninguna feature) y envuelve a todas las rutas protegidas por `AuthGuard`; `/login` queda fuera del shell.
- Ítems de navegación de nivel superior (sin roles, todos los usuarios ven lo mismo):
  - Dashboard → `/`
  - Productos → `/productos`
  - Actividades → `/actividades`
- Perfil no es un ítem más del menú: vive en el **footer** de la sidebar como una tarjeta con avatar (iniciales de `nombre`/`apellido`), nombre completo y correo del usuario logueado (`AuthContext`); al hacer click navega a `/perfil`. En desktop colapsado se ve solo el avatar.
- El shell no incluye acción de logout en esta versión — queda documentado en la spec de Profile (ver `spec/auth/login-feature.md`, sección "Política de estado").
- En desktop: la sidebar se pliega a un rail de iconos y se expande a nombres + iconos; el usuario puede alternar el estado con un control visible en la propia sidebar.
- En mobile: la sidebar se comporta como un sheet (overlay) disparado desde un botón de menú en la parte superior de la pantalla; no ocupa espacio fijo del layout.

### Dashboard (métricas)
- Ruta `/` muestra 3 tarjetas de métricas, sin filtros ni rango de fechas configurable en esta versión:
  1. **Ventas del mes**: suma de montos reales vendidos (`unit_price * sold_qty`) de actividades con `status = 'closed'` cuyo `closed_at` cae en el mes en curso.
  2. **Actividad más rentable**: la actividad `'closed'` con mayor monto real vendido (nombre + monto). Si no hay ninguna actividad cerrada, se muestra un estado vacío.
  3. **Productos con stock bajo**: cantidad de productos **activos** (`is_active = true`, ver `spec/products/products-feature.md`) con `stock < LOW_STOCK_THRESHOLD`, con un listado corto (máx. 5) de los más críticos. Los productos desactivados no participan de esta métrica.
- No se agregan métricas fuera de esta lista (ej. costo/margen) sin confirmarlo antes con el usuario, según lo indicado en `CLAUDE.md`.

## Reglas objetivo
- `LOW_STOCK_THRESHOLD` es una constante única definida en `src/shared/core/` (ej. `constants.ts`), reutilizada por el dashboard y por cualquier otra pantalla que necesite marcar stock bajo (ej. listado de productos) — no se hardcodea el número en más de un archivo.
- El cálculo de "ventas del mes" y "actividad más rentable" se hace sobre actividades **cerradas** únicamente; actividades abiertas no participan de estas métricas (su venta todavía no es definitiva).
- El estado expandido/colapsado de la sidebar en desktop se recuerda entre sesiones (no vuelve a colapsado por defecto en cada carga).

## Vistas afectadas
- **Desktop (≥ md)**: sidebar como rail fijo a la izquierda (colapsado por defecto o según preferencia guardada) + contenido principal a la derecha con las 3 tarjetas de métricas en una grilla.
- **Mobile (< md)**: sidebar oculta por defecto, accesible como sheet desde un botón de menú; las 3 tarjetas de métricas se apilan verticalmente.

## Política de estado
- El estado expandido/colapsado y la apertura del sheet mobile los maneja internamente el propio componente `animated-sidebar` de beUI (no se duplica ese estado en un contexto propio).
- Preferencia de expandido/colapsado persistida en localStorage (clave a definir, ej. `peluchera_stock_sidebar_state`).
- Las métricas del dashboard se obtienen vía TanStack Query (`useDashboardMetrics` en `features/dashboard/hooks/`), sin estado local propio más allá del que maneje la query (loading/error/data).

## Contratos de datos
- Constante: `src/shared/core/constants.ts` → `LOW_STOCK_THRESHOLD` (número, valor a definir con el usuario si no hay uno ya acordado; placeholder `5`).
- Hook de datos: `src/features/dashboard/hooks/useDashboardMetrics.ts` — una query que combina:
  - `activities` (`status = 'closed'`) + `activity_products` (para monto real vendido por actividad y por mes).
  - `products` (para contar y listar los de `stock < LOW_STOCK_THRESHOLD`).
- Requiere que existan en Supabase las tablas `products`, `activities` y `activity_products` según el modelo de dominio de `AGENTS.md` sección 3 — ninguna de las tres está creada todavía.

## Persistencia
- Preferencia de sidebar (expandido/colapsado): localStorage, no crítico, se puede perder sin afectar el negocio.
- Métricas del dashboard: no se persisten en cliente, se recalculan en cada carga vía Supabase (cacheadas por TanStack Query según su configuración estándar).

## Errores esperados y recuperación
- Falla la carga de métricas (error de red/Supabase): la vista muestra un estado de error por tarjeta con opción de reintentar, sin romper el resto del dashboard.
- No hay actividades cerradas todavía: "Ventas del mes" muestra `$0`, "Actividad más rentable" muestra un estado vacío ("Todavía no hay actividades cerradas").
- No hay productos con stock bajo: la tarjeta correspondiente muestra un estado positivo ("Todo el stock está en niveles saludables") en vez de una lista vacía.

## Navegación relevante
- `src/app/routes.tsx` pasa a anidar las rutas protegidas dentro de un layout de la app (ej. `AppLayout`) que renderiza la sidebar + un `<Outlet />`:
  - `/` → Dashboard (esta spec).
  - `/productos`, `/actividades`, `/perfil` → placeholders hasta que existan sus propias specs.
- `AuthGuard` sigue siendo quien decide si se entra al layout protegido o se redirige a `/login`; no cambia su lógica, solo pasa a envolver al `AppLayout` en vez de a la ruta `/` directamente.

## Profundidad en Supabase
- No aplica todavía: esta versión asume que `products`, `activities` y `activity_products` existen con la forma descrita en `AGENTS.md`. La creación de esas tablas y sus políticas RLS se documentará en las specs de Productos y Actividades respectivamente, no en esta.
- Si el cálculo de "actividad más rentable" resulta costoso de hacer en el cliente a medida que crezcan los datos, evaluar moverlo a una función/RPC de Postgres — no implementarlo así de entrada sin necesidad confirmada.

## Brechas detectadas en la implementación actual
- `No definido aún en esta versión.` (feature aún no implementada; hoy `src/app/routes.tsx` solo tiene un placeholder `<div>Peluchera Stock</div>` en `/`, y `src/features/dashboard/` está vacía).

## Criterios de aceptación
- Cualquier ruta protegida (`/`, `/productos`, `/actividades`, `/perfil`) muestra la sidebar; `/login` no la muestra.
- En desktop, la sidebar se puede colapsar/expandir y ese estado sigue igual después de recargar la página.
- En mobile, la sidebar no ocupa espacio fijo y se abre/cierra como sheet desde un botón de menú.
- En `/`, con al menos una actividad cerrada este mes, "Ventas del mes" muestra la suma correcta de `unit_price * sold_qty` de esas actividades.
- En `/`, la actividad cerrada con mayor monto real vendido aparece como "más rentable"; si hay empate, se acepta mostrar cualquiera de las empatadas (no hay regla de desempate en esta versión).
- En `/`, los productos con `stock < LOW_STOCK_THRESHOLD` aparecen listados (máx. 5) y el conteo total es correcto.
- Ningún archivo del dashboard ni de la sidebar hardcodea el valor de `LOW_STOCK_THRESHOLD` fuera de `src/shared/core/constants.ts`.

## Preguntas abiertas
- ¿Cuál es el valor definitivo de `LOW_STOCK_THRESHOLD`? Se usa `5` como placeholder hasta confirmarlo.
