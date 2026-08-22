# Dashboard Feature

## Versión
v1-metricas-extendidas

> **Nota sobre v0:** el shell de navegación (sidebar animado) y las 3 métricas originales (ventas del mes, actividad más rentable, stock bajo) ya están implementados tal cual describía `v0-objective-draft` — esa sección se conserva sin cambios más abajo. Esta versión solo **agrega** 7 tarjetas nuevas al dashboard existente, no reemplaza nada.

## Objetivo
Dar a la app un shell de navegación único (sidebar animado de beUI) que envuelva todas las rutas protegidas y sirva de punto de partida visual para el resto de las pantallas, y dentro de ese shell, mostrar en la ruta `/` un dashboard con las métricas clave del negocio: además de las 3 métricas originales (ventas del mes, actividad más rentable, productos con stock bajo), agregar visibilidad sobre caja chica, tendencia de ventas, productos top, actividades abiertas y salud general de inventario, sin agregar filtros ni configuración en esta versión.

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

### Dashboard (métricas nuevas — v1)
Se agregan 7 tarjetas más, en el mismo grid, sin filtros configurables:

4. **Estado de caja chica**: si hay una caja abierta (`useCurrentCashCut`), muestra "Abierta desde [fecha de apertura]" + el monto inicial. Si no hay ninguna caja abierta, muestra un estado vacío ("Sin caja abierta") con un link a `/caja-chica`. No duplica el subtotal real/ganancia en vivo (eso ya vive en `/caja-chica`).
5. **Ventas por período** (reemplaza a la idea inicial de "Ventas por semana", ajustada tras feedback de usuario): tarjeta con dos sub-pestañas (`Tabs`, `variant="pill"`, mismo patrón que Actividades/Caja Chica) — **"Mes"** y **"Año"** — cada una navegable con controles ◀ / ▶ para moverse período a período (no una ventana fija de los últimos N):
   - **Mes**: encabezado con el mes+año actualmente seleccionado (ej. "Junio 2026") y su total vendido; debajo, gráfico de barras (recharts) con el desglose por semana calendario **dentro de ese mes**. El botón ▶ se deshabilita al llegar al mes en curso (no se navega a futuro).
   - **Año**: mismo patrón — encabezado con el año seleccionado y su total; debajo, gráfico de barras con el desglose por mes calendario dentro de ese año. ▶ deshabilitado al llegar al año en curso.
   - No existe una sub-pestaña "Semana" (se descartó explícitamente: la semana es la unidad más chica, no hace falta navegar semana a semana por separado).
   - Al cargar el dashboard, arranca en el mes/año actual.
6. **Productos más vendidos**: top 5 productos por `sold_qty` acumulado (suma de `activity_products.sold_qty` agrupado por `product_id`) entre todas las actividades `closed`, mostrados como un ranking con barras horizontales proporcionales al producto más vendido (no una lista de texto plano). Si no hay ninguna actividad cerrada, estado vacío ("Todavía no hay ventas registradas").
7. **Actividades abiertas**: cantidad de actividades con `status = 'open'`, y de esas, nombre y antigüedad (en días, `now() - created_at`) de la más antigua. Si no hay ninguna abierta, estado vacío ("No hay actividades abiertas").
8. **Ventas: mes actual vs. anterior**: dos montos (mes en curso y mes calendario anterior) + variación porcentual entre ambos, con un indicador visual (par de barras comparativas cortas + flecha de tendencia ↑/↓ coloreada según el signo), sobre el mismo cálculo de "ventas del mes" ya definido arriba. Si el mes anterior fue `0` y el actual no, se muestra la variación como "+100%" en vez de dividir por cero; si ambos son `0`, se muestra "0%" sin signo ni flecha.
9. **Ticket promedio por actividad**: monto real vendido total (todas las actividades `closed`, sin filtro de mes) dividido por la cantidad de actividades `closed`. Si no hay ninguna actividad cerrada, estado vacío ("Todavía no hay actividades cerradas").
10. **Stock valorizado**: `Σ (stock * price)` de productos **activos** (`is_active = true`), como medida de salud general de inventario — complementa a "Productos con stock bajo", no la reemplaza.

### Rediseño de "Productos con stock bajo" (v1)
La tarjeta original de v0 (conteo + lista de texto plano) se reemplaza por una lista con una mini barra de progreso por producto (`stock` actual sobre `LOW_STOCK_THRESHOLD`), para que la severidad se lea de un vistazo sin ser un gráfico completo:
- Color **rojo** cuando `stock === 0` o `stock / LOW_STOCK_THRESHOLD < 0.34`; **ámbar** en el resto de los casos (todos los productos listados ya están por debajo del umbral, así que la diferencia de color solo distingue "crítico" de "bajo").
- Se sigue mostrando el conteo total arriba y como máximo 5 productos, mismo criterio que v0.

## Reglas objetivo
- `LOW_STOCK_THRESHOLD` es una constante única definida en `src/shared/core/` (ej. `constants.ts`), reutilizada por el dashboard y por cualquier otra pantalla que necesite marcar stock bajo (ej. listado de productos) — no se hardcodea el número en más de un archivo.
- El cálculo de "ventas del mes" y "actividad más rentable" se hace sobre actividades **cerradas** únicamente; actividades abiertas no participan de estas métricas (su venta todavía no es definitiva).
- El estado expandido/colapsado de la sidebar en desktop se recuerda entre sesiones (no vuelve a colapsado por defecto en cada carga).
- Las 7 métricas nuevas de v1 siguen el mismo criterio que las de v0: "ventas", "ticket promedio" y "mes actual vs. anterior" se calculan sobre actividades **cerradas** únicamente; "actividades abiertas" es la única tarjeta que mira `status = 'open'` a propósito.
- "Stock valorizado" y "Productos con stock bajo" comparten el mismo filtro `is_active = true`, pero son independientes entre sí — no hay una jerarquía entre ambas tarjetas.
- Ninguna de las 7 tarjetas nuevas agrega filtros, rango de fechas ni configuración por parte del usuario en esta versión (mismo criterio que v0).

## Vistas afectadas
- **Desktop (≥ md)**: sidebar como rail fijo a la izquierda (colapsado por defecto o según preferencia guardada) + contenido principal a la derecha con las tarjetas de métricas en una grilla (ahora 10 en vez de 3).
- **Mobile (< md)**: sidebar oculta por defecto, accesible como sheet desde un botón de menú; las tarjetas de métricas se apilan verticalmente.
- El gráfico de "Ventas por semana" ocupa el ancho completo de su celda de grid (no se achica junto a las demás tarjetas de una sola métrica) — mismo criterio visual que un `MetricCard` normal pero con `recharts` `ResponsiveContainer` adentro en vez de texto.

## Política de estado
- El estado expandido/colapsado y la apertura del sheet mobile los maneja internamente el propio componente `animated-sidebar` de beUI (no se duplica ese estado en un contexto propio).
- Preferencia de expandido/colapsado persistida en localStorage (clave a definir, ej. `peluchera_stock_sidebar_state`).
- Las métricas del dashboard se obtienen vía TanStack Query (`useDashboardMetrics` en `features/dashboard/hooks/`), sin estado local propio más allá del que maneje la query (loading/error/data). Las 7 métricas nuevas de v1 se agregan al mismo objeto `DashboardMetrics` y a la misma query (`queryKey: ['dashboard', 'metrics']`) — no se crean queries nuevas por tarjeta, para no multiplicar round-trips a Supabase en una misma pantalla.
- La tarjeta "Estado de caja chica" es la única excepción: reutiliza el hook ya existente `useCurrentCashCut` (`features/caja-chica/hooks/`) en vez de traer ese dato en `useDashboardMetrics`, porque ya existe y ya está cacheado bajo `['cash-cuts', 'current']`.

## Contratos de datos
- Constante: `src/shared/core/constants.ts` → `LOW_STOCK_THRESHOLD` (número, valor a definir con el usuario si no hay uno ya acordado; placeholder `5`).
- Hook de datos: `src/features/dashboard/hooks/useDashboardMetrics.ts` — una query que combina:
  - `activities` (`status = 'closed'`) + `activity_products` (para monto real vendido por actividad, por mes, por semana y por producto).
  - `activities` (`status = 'open'`) para la tarjeta de actividades abiertas.
  - `products` (para contar/listar los de `stock < LOW_STOCK_THRESHOLD` y para el stock valorizado de productos activos).
- `DashboardMetrics` (tipo devuelto por `fetchDashboardMetrics`) se extiende con:
  ```ts
  {
    // ...campos v0 sin cambios...
    salesHistory: { date: string; amount: number }[] // una entrada por día con ventas, agrupa todas las actividades cerradas ese día
    topProducts: { id: string; name: string; soldQty: number }[] // máx. 5
    openActivities: { count: number; oldest: { name: string; daysOpen: number } | null }
    salesComparison: { currentMonth: number; previousMonth: number; percentChange: number }
    averageTicket: number | null // null si no hay actividades cerradas
    inventoryValue: number
  }
  ```
  `salesHistory` es la única fuente de datos de la tarjeta "Ventas por período" — la navegación entre meses/años y el desglose por semana/mes se calculan 100% en el cliente (`src/features/dashboard/utils/salesPeriods.ts`) a partir de este array, sin volver a pedirle datos a Supabase al navegar (evita un round-trip por cada click en ◀ / ▶).
- Requiere que existan en Supabase las tablas `products`, `activities` y `activity_products` según el modelo de dominio de `AGENTS.md` sección 3 — ya están creadas (implementadas en versiones posteriores a `v0-objective-draft`).

## Persistencia
- Preferencia de sidebar (expandido/colapsado): localStorage, no crítico, se puede perder sin afectar el negocio.
- Métricas del dashboard: no se persisten en cliente, se recalculan en cada carga vía Supabase (cacheadas por TanStack Query según su configuración estándar).

## Errores esperados y recuperación
- Falla la carga de métricas (error de red/Supabase): la vista muestra un estado de error por tarjeta con opción de reintentar, sin romper el resto del dashboard. Como las 7 tarjetas nuevas comparten query con las 3 originales, un error afecta a las 10 a la vez (excepto "Estado de caja chica", que depende de su propio hook).
- No hay actividades cerradas todavía: "Ventas del mes" muestra `$0`, "Actividad más rentable", "Productos más vendidos" y "Ticket promedio" muestran estado vacío; "Ventas por semana" muestra las 6 barras en `0`; "Mes actual vs. anterior" muestra `$0` en ambos con variación `0%`.
- No hay productos con stock bajo: la tarjeta correspondiente muestra un estado positivo ("Todo el stock está en niveles saludables") en vez de una lista vacía.
- No hay actividades abiertas: "Actividades abiertas" muestra estado vacío ("No hay actividades abiertas").
- No hay caja abierta: "Estado de caja chica" muestra "Sin caja abierta" + link a `/caja-chica`.

## Navegación relevante
- `src/app/routes.tsx` pasa a anidar las rutas protegidas dentro de un layout de la app (ej. `AppLayout`) que renderiza la sidebar + un `<Outlet />`:
  - `/` → Dashboard (esta spec).
  - `/productos`, `/actividades`, `/perfil` → placeholders hasta que existan sus propias specs.
- `AuthGuard` sigue siendo quien decide si se entra al layout protegido o se redirige a `/login`; no cambia su lógica, solo pasa a envolver al `AppLayout` en vez de a la ruta `/` directamente.

## Profundidad en Supabase
- No aplica todavía: esta versión asume que `products`, `activities` y `activity_products` existen con la forma descrita en `AGENTS.md`. La creación de esas tablas y sus políticas RLS se documentará en las specs de Productos y Actividades respectivamente, no en esta.
- Si el cálculo de "actividad más rentable" resulta costoso de hacer en el cliente a medida que crezcan los datos, evaluar moverlo a una función/RPC de Postgres — no implementarlo así de entrada sin necesidad confirmada.

## Brechas detectadas en la implementación actual
- v0 (shell + 3 métricas originales) ya está implementada: `src/app/AppLayout.tsx`, `src/app/routes.tsx` y `src/features/dashboard/` existen y funcionan.
- Las 7 métricas nuevas de v1 son las que agrega esta versión — antes de implementarlas, `useDashboardMetrics`/`fetchDashboardMetrics` solo devuelven `salesThisMonth`, `topActivity`, `lowStockCount` y `lowStockProducts`.

## Criterios de aceptación
- Cualquier ruta protegida (`/`, `/productos`, `/actividades`, `/perfil`) muestra la sidebar; `/login` no la muestra.
- En desktop, la sidebar se puede colapsar/expandir y ese estado sigue igual después de recargar la página.
- En mobile, la sidebar no ocupa espacio fijo y se abre/cierra como sheet desde un botón de menú.
- En `/`, con al menos una actividad cerrada este mes, "Ventas del mes" muestra la suma correcta de `unit_price * sold_qty` de esas actividades.
- En `/`, la actividad cerrada con mayor monto real vendido aparece como "más rentable"; si hay empate, se acepta mostrar cualquiera de las empatadas (no hay regla de desempate en esta versión).
- En `/`, los productos con `stock < LOW_STOCK_THRESHOLD` aparecen listados (máx. 5) y el conteo total es correcto.
- Ningún archivo del dashboard ni de la sidebar hardcodea el valor de `LOW_STOCK_THRESHOLD` fuera de `src/shared/core/constants.ts`.
- Con una caja abierta, "Estado de caja chica" muestra su fecha de apertura y monto inicial; sin caja abierta, muestra el estado vacío con link a `/caja-chica`.
- "Ventas por período" arranca en el mes/año actual; navegar con ◀ cambia de período y actualiza el total y el desglose; ▶ está deshabilitado en el mes/año en curso (no se puede ir a futuro).
- Dentro de la sub-pestaña "Mes", el desglose por semana solo incluye las semanas que caen dentro del mes seleccionado.
- "Productos más vendidos" lista hasta 5 productos ordenados por `sold_qty` acumulado descendente, con barra proporcional al primero del ranking.
- "Productos con stock bajo" muestra una barra de progreso por producto, en rojo si `stock === 0` o `stock / LOW_STOCK_THRESHOLD < 0.34`, ámbar en el resto.
- "Actividades abiertas" muestra el conteo correcto de `status = 'open'` y, si hay al menos una, la más antigua por `created_at`.
- "Mes actual vs. anterior" no divide por cero cuando el mes anterior es `0`.
- "Ticket promedio" es `totalVendido / cantidadActividadesCerradas`, `null`/estado vacío si no hay ninguna.
- "Stock valorizado" suma `stock * price` solo de productos con `is_active = true`.

## Preguntas abiertas
- ¿Cuál es el valor definitivo de `LOW_STOCK_THRESHOLD`? Se usa `5` como placeholder hasta confirmarlo.
