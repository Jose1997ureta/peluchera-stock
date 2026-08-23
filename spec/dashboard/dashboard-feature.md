# Dashboard Feature

## Versión
v7-metricas-adicionales

> **Nota sobre v0:** el shell de navegación (sidebar animado) ya está implementado tal cual describía `v0-objective-draft`. Las métricas originales de v0 fueron reemplazadas/renombradas/eliminadas por versiones posteriores — esta spec ya no describe la v0 de las tarjetas de métricas, solo el shell.
>
> **Nota sobre v2 — corrección de terminología:** se detectó que "Ventas del mes"/"Ventas por período"/etc. usaban como cálculo `Σ (unit_price * sold_qty)` — pero esa cifra es la que el resto de la app (modal de detalle de actividad, `spec/caja-chica/caja-chica-feature.md`) ya llama **"Inversión"** (precio de catálogo de lo vendido, no plata real entrante). La plata que efectivamente entra es `revenue` ("Ingreso"), y la **ganancia neta** real es `revenue - inversión` (lo que el modal de actividad muestra en verde como "Monto real"). v2 corrigió esto: todo lo que decía "Ventas" pasó a decir "Inversión", y se agregó "Ganancia del mes".
>
> **Nota sobre v3 — "Ganancia por período" + limpieza:** se agregó "Ganancia por período" (misma navegación Mes/Año que "Inversión por período"), se eliminaron "Actividad más rentable" y "Ticket promedio por actividad" (decisión del usuario), y se corrigió un bug de antigüedad negativa en "Actividades abiertas".
>
> **Nota sobre v4:** se eliminó "Stock valorizado" (decisión del usuario, sin reemplazo).
>
> **Nota sobre v5 — foco en inversión/ganancia:** se eliminaron "Productos con stock bajo" y "Productos más vendidos", y "Inversión por período" / "Ganancia por período" pasaron a ser las dos primeras tarjetas del dashboard.
>
> **Nota sobre v6 — se eliminan "Inversión del mes" y "Ganancia del mes":** quedaron redundantes con el total que ya muestra el encabezado "Mes" de cada tarjeta de período.
>
> **Nota sobre v7 (esta versión) — el dashboard se sentía vacío con solo 5 tarjetas; se agregan 4 más:**
> - **"Actividades por período"**: mismo componente `PeriodChartCard` que "Inversión/Ganancia por período" (Mes/Año, ◀ / ▶), pero graficando **cantidad de actividades cerradas** en vez de un monto — `PeriodChartCard` gana un prop opcional `formatValue` para no forzar formato de moneda en un conteo.
> - **"Ganancia acumulada histórica"**: KPI simple, `Σ` de ganancia de TODAS las actividades cerradas (sin filtro de mes) — complementa a "Ganancia por período" (que es navegable/parcial) con un total de referencia.
> - **"Margen promedio"**: `gananciaHistórica / inversiónHistórica * 100`, `0` si no hay inversión — una lectura de rentabilidad relativa que hasta ahora no existía (todo lo demás son montos absolutos).
> - **"Ranking de zonas (mes actual)"**: ganancia neta agrupada por `zona_id` de las actividades cerradas este mes, como ranking de barras horizontales (mismo patrón visual que la vieja "Productos más vendidos"). Requiere la tabla `zonas` (ya usada en Caja Chica → Historial).
> - **"Historial de cajas cerradas"**: lista de hasta 5 cajas cerradas más recientes (número de caja + fecha de cierre + ganancia), reutilizando el hook `useCashCuts` ya existente de Caja Chica (`queryKey: ['cash-cuts', 'history']`) en vez de duplicar esa data en `useDashboardMetrics`.

## Objetivo
Dar a la app un shell de navegación único (sidebar animado de beUI) que envuelva todas las rutas protegidas, y dentro de ese shell, mostrar en la ruta `/` un dashboard enfocado en inversión, ganancia y actividad del negocio (por período navegable, del mes en curso e histórico), zonas más rentables, estado de caja chica/su historial y actividades abiertas — sin agregar filtros ni configuración en esta versión.

## Alcance objetivo

### Shell de navegación (Animated Sidebar)
- Se usa el componente `animated-sidebar` de beUI (instalado vía su MCP) como único mecanismo de navegación principal de la app — no se combina con `Dock` ni con otro patrón de navegación en esta versión.
- Vive en `src/app/` (layout de la app, no es parte de ninguna feature) y envuelve a todas las rutas protegidas por `AuthGuard`; `/login` queda fuera del shell.
- Ítems de navegación de nivel superior (sin roles, todos los usuarios ven lo mismo): Dashboard → `/`, Productos → `/productos`, Actividades → `/actividades`, Caja Chica → `/caja-chica`.
- Perfil no es un ítem más del menú: vive en el **footer** de la sidebar como una tarjeta con avatar (iniciales de `nombre`/`apellido`), nombre completo y correo del usuario logueado (`AuthContext`); al hacer click navega a `/perfil`. En desktop colapsado se ve solo el avatar.
- El shell no incluye acción de logout en esta versión — queda documentado en la spec de Profile (ver `spec/auth/login-feature.md`, sección "Política de estado").
- En desktop: la sidebar se pliega a un rail de iconos y se expande a nombres + iconos; el usuario puede alternar el estado con un control visible en la propia sidebar.
- En mobile: la sidebar se comporta como un sheet (overlay) disparado desde un botón de menú en la parte superior de la pantalla; no ocupa espacio fijo del layout.

### Dashboard — tarjetas de métricas
Ruta `/` muestra las siguientes tarjetas, **en este orden**, sin filtros ni rango de fechas configurable en esta versión, en un grid (`sm:grid-cols-2 lg:grid-cols-3`):

1. **Inversión por período**: tarjeta con dos sub-pestañas (`Tabs`, `variant="pill"`) — **"Mes"** y **"Año"** — cada una navegable con controles ◀ / ▶ para moverse período a período (no una ventana fija de los últimos N):
   - **Mes**: encabezado con el mes+año seleccionado (ej. "Junio 2026") y su inversión total; debajo, gráfico de barras (recharts) con el desglose por semana calendario **dentro de ese mes**. ▶ se deshabilita al llegar al mes en curso (no se navega a futuro).
   - **Año**: mismo patrón a nivel de meses dentro del año. ▶ deshabilitado al llegar al año en curso.
   - No existe una sub-pestaña "Semana" (descartada explícitamente: la semana es la unidad más chica, no hace falta navegarla por separado).
   - Al cargar el dashboard, arranca en el mes/año actual.
2. **Ganancia por período**: mismo componente y mismo patrón de navegación que "Inversión por período" (Mes/Año, ◀ / ▶, arranca en el período actual), pero sobre la serie de ganancia neta (`revenue - inversión`) en vez de inversión.
3. **Actividades por período** (nueva en v7): mismo componente y navegación, pero graficando la **cantidad** de actividades cerradas por semana (vista Mes) o por mes (vista Año) — el encabezado muestra el total de actividades del período seleccionado, formateado como número entero, no como moneda.
4. **Estado de caja chica**: si hay una caja abierta (`useCurrentCashCut`), muestra "Abierta desde [fecha de apertura]" + el monto inicial. Si no hay ninguna, estado vacío ("Sin caja abierta") con un link a `/caja-chica`. No duplica el subtotal real/ganancia en vivo (eso ya vive en `/caja-chica`).
5. **Actividades abiertas**: cantidad de actividades con `status = 'open'`, y de esas, nombre y antigüedad en días (`max(0, now() - created_at)`, nunca negativa) de la más antigua, en líneas separadas (etiqueta "Abierta hace más tiempo" / nombre / "N día(s) abierta" o "Abierta hoy" si `daysOpen === 0`). Si no hay ninguna abierta, estado vacío ("No hay actividades abiertas").
6. **Inversión: mes actual vs. anterior**: dos montos (mes en curso y mes calendario anterior) + variación porcentual, con un indicador visual (par de barras comparativas cortas + flecha de tendencia ↑/↓ coloreada según el signo). Si el mes anterior fue `0` y el actual no, la variación se muestra como "+100%" en vez de dividir por cero; si ambos son `0`, se muestra "0%" sin signo ni flecha.
7. **Ganancia acumulada histórica** (nueva en v7): `Σ (revenue - unit_price*sold_qty)` de TODAS las actividades cerradas, sin filtro de mes — número grande + la inversión histórica equivalente como referencia secundaria.
8. **Margen promedio** (nueva en v7): `Σganancia histórica / Σinversión histórica * 100`, mostrado como porcentaje. `0%` si no hay inversión histórica todavía (evita dividir por cero).
9. **Ranking de zonas (mes actual)** (nueva en v7): ganancia neta agrupada por zona de las actividades cerradas en el mes en curso, como ranking de barras horizontales (máx. 5, ordenado de mayor a menor), barra proporcional a la zona líder. Si no hay actividades cerradas este mes, estado vacío ("Todavía no hay actividades cerradas este mes").
10. **Historial de cajas cerradas** (nueva en v7): lista de hasta 5 cajas cerradas más recientes — número de caja (`sequenceNumber`), fecha de cierre y ganancia (`totalProfit`) de cada una. Si no hay ninguna cerrada, estado vacío ("Todavía no hay cajas cerradas").

No se agregan métricas fuera de esta lista (ej. costo/margen unitario por producto) sin confirmarlo antes con el usuario, según lo indicado en `CLAUDE.md`.

## Reglas objetivo
- **"Inversión" (`Σ unit_price * sold_qty`) y "Ganancia" (`Σ (revenue - unit_price * sold_qty)`) son conceptos distintos** y ninguna tarjeta puede usar uno donde corresponde el otro — mismo criterio que `spec/caja-chica/caja-chica-feature.md` y el modal de detalle de actividad ("Monto de la inversión" / "Monto real").
- Todas las métricas de inversión/ganancia/actividades por período, mensuales y comparativas se calculan sobre actividades **cerradas** únicamente; actividades abiertas no participan (su venta todavía no es definitiva). "Actividades abiertas" es la única tarjeta que mira `status = 'open'` a propósito.
- El estado expandido/colapsado de la sidebar en desktop se recuerda entre sesiones (no vuelve a colapsado por defecto en cada carga).
- Ninguna tarjeta agrega filtros, rango de fechas ni configuración por parte del usuario en esta versión — "Ranking de zonas" e "Historial de cajas" no son filtrables desde el dashboard (para eso ya existe Caja Chica → Historial).
- La antigüedad en días de una actividad abierta nunca se muestra negativa, aunque `created_at` sea posterior a "ahora" (dato inconsistente) — se acota a `0` como mínimo.
- El dashboard no consulta la tabla `products` en esta versión (ninguna tarjeta actual la necesita); sí consulta `zonas` desde v7.
- "Ganancia acumulada histórica" y "Margen promedio" son sobre el total histórico (sin filtro), a diferencia del resto de las tarjetas de inversión/ganancia que son mensuales o por período navegable — no deben confundirse entre sí.

## Vistas afectadas
- **Desktop (≥ md)**: sidebar como rail fijo a la izquierda + contenido principal a la derecha con las 9 tarjetas de métricas en una grilla, en el orden fijo listado arriba (las tres de período primero).
- **Mobile (< md)**: sidebar oculta por defecto, accesible como sheet desde un botón de menú; las tarjetas se apilan verticalmente, mismo orden.
- "Inversión por período", "Ganancia por período" y "Actividades por período" ocupan el ancho completo de su celda de grid — mismo criterio visual que un `MetricCard` normal, pero con `recharts` `ResponsiveContainer` adentro en vez de texto.

## Política de estado
- El estado expandido/colapsado y la apertura del sheet mobile los maneja internamente el propio componente `animated-sidebar` de beUI (no se duplica ese estado en un contexto propio). Persistido en localStorage (`peluchera_stock_sidebar_state`).
- Las métricas del dashboard se obtienen vía TanStack Query (`useDashboardMetrics` en `features/dashboard/hooks/`), una sola query (`queryKey: ['dashboard', 'metrics']`) que alimenta todas las tarjetas salvo "Estado de caja chica" e "Historial de cajas cerradas" — no se crean queries nuevas por tarjeta más allá de las ya existentes que se reutilizan.
- "Estado de caja chica" reutiliza `useCurrentCashCut` (`features/caja-chica/hooks/`, `queryKey: ['cash-cuts', 'current']`).
- "Historial de cajas cerradas" reutiliza `useCashCuts` (`features/caja-chica/hooks/`, `queryKey: ['cash-cuts', 'history']`) — mismo hook que ya usa la pestaña "Caja Chica" de `/caja-chica`, sin duplicar esa data en el dashboard.
- "Inversión por período", "Ganancia por período" y "Actividades por período" comparten el mismo componente genérico `PeriodChartCard` (`src/features/dashboard/components/PeriodChartCard.tsx`), que recibe un array `{ date, amount }[]` y un `formatValue` opcional (default `formatCurrency`), y maneja su propia navegación de cursor mes/año como estado local (no en la query) — cambiar de período no dispara ningún fetch nuevo.

## Contratos de datos
- Hook de datos: `src/features/dashboard/hooks/useDashboardMetrics.ts` → `fetchDashboardMetrics` (`src/features/dashboard/hooks/api.ts`) combina:
  - `activities` (`status = 'closed'`) + `revenue` + `zona_id` + `activity_products(unit_price, sold_qty)` (para inversión/ganancia/cantidad por actividad, por mes, por período y por zona).
  - `activities` (`status = 'open'`, `name`, `created_at`) para "Actividades abiertas".
  - `zonas` (`id`, `name`) para nombrar el ranking de zonas.
- `DashboardMetrics` (tipo devuelto por `fetchDashboardMetrics`):
  ```ts
  {
    investmentHistory: { date: string; amount: number }[] // fuente de "Inversión por período"
    profitHistory: { date: string; amount: number }[] // fuente de "Ganancia por período"
    activitiesHistory: { date: string; amount: number }[] // fuente de "Actividades por período" (amount = conteo)
    openActivities: { count: number; oldest: { name: string; daysOpen: number } | null }
    investmentComparison: { currentMonth: number; previousMonth: number; percentChange: number }
    allTime: { investment: number; profit: number } // sin filtro de mes
    averageMarginPercent: number // allTime.profit / allTime.investment * 100, 0 si no hay inversión
    zoneRanking: { zonaId: number; zoneName: string; profit: number }[] // mes actual, máx. 5, desc
  }
  ```
  `investmentHistory`/`profitHistory`/`activitiesHistory` son la única fuente de datos de sus tarjetas de período — la navegación entre meses/años y el desglose por semana/mes se calculan 100% en el cliente (`src/features/dashboard/utils/periodBreakdown.ts`, funciones genéricas sobre `{ date, amount }[]`), sin volver a pedirle datos a Supabase al navegar.
- Requiere que existan en Supabase las tablas `activities`, `activity_products` y `zonas` según `AGENTS.md` sección 3 — ya están creadas.

## Persistencia
- Preferencia de sidebar (expandido/colapsado): localStorage, no crítico.
- Métricas del dashboard: no se persisten en cliente, se recalculan en cada carga vía Supabase (cacheadas por TanStack Query según su configuración estándar).

## Errores esperados y recuperación
- Falla la carga de métricas (error de red/Supabase): la vista muestra un estado de error por tarjeta con opción de reintentar, sin romper el resto del dashboard. Como 7 de las 9 tarjetas comparten la query de `useDashboardMetrics`, un error las afecta a todas a la vez (excepto "Estado de caja chica" e "Historial de cajas cerradas", que dependen de sus propios hooks).
- No hay actividades cerradas todavía: "Inversión/Ganancia/Actividades por período" muestran sus barras y su total en `0`; "Inversión: mes actual vs. anterior" muestra `$0` en ambos con variación `0%`; "Ganancia acumulada histórica" muestra `$0`; "Margen promedio" muestra `0%`; "Ranking de zonas" muestra su estado vacío.
- No hay actividades cerradas este mes (pero sí históricamente): "Ranking de zonas" muestra su estado vacío aunque "Ganancia acumulada histórica"/"Margen promedio" tengan datos.
- No hay actividades abiertas: estado vacío ("No hay actividades abiertas").
- No hay caja abierta: "Sin caja abierta" + link a `/caja-chica`.
- No hay cajas cerradas todavía: "Historial de cajas cerradas" muestra su estado vacío.

## Navegación relevante
- `src/app/routes.tsx` anida las rutas protegidas dentro de `AppLayout`, que renderiza la sidebar + un `<Outlet />`. `AuthGuard` decide si se entra al layout protegido o se redirige a `/login`.

## Profundidad en Supabase
- Esta versión asume que `activities`, `activity_products` y `zonas` ya existen con la forma descrita en `AGENTS.md`.
- Si el cálculo de métricas resulta costoso de hacer en el cliente a medida que crezcan los datos, evaluar moverlo a una función/RPC de Postgres — no implementarlo así de entrada sin necesidad confirmada.

## Brechas detectadas en la implementación actual
- Ninguna: v7 (incluyendo las correcciones de v2-v6) ya está implementada en el código a la fecha de esta versión de la spec.

## Criterios de aceptación
- Cualquier ruta protegida (`/`, `/productos`, `/actividades`, `/caja-chica`, `/perfil`) muestra la sidebar; `/login` no la muestra.
- En desktop, la sidebar se puede colapsar/expandir y ese estado sigue igual después de recargar la página.
- En mobile, la sidebar no ocupa espacio fijo y se abre/cierra como sheet desde un botón de menú.
- En `/`, "Inversión por período", "Ganancia por período" y "Actividades por período" son las tres primeras tarjetas, en ese orden.
- "Actividades por período" muestra un conteo entero (sin símbolo de moneda) en su encabezado y en el tooltip del gráfico.
- Con una caja abierta, "Estado de caja chica" muestra su fecha de apertura y monto inicial; sin caja abierta, muestra el estado vacío con link a `/caja-chica`.
- Las tres tarjetas de período arrancan en el mes/año actual; navegar con ◀ cambia de período y actualiza el total y el desglose; ▶ está deshabilitado en el mes/año en curso.
- Dentro de la sub-pestaña "Mes" (en cualquiera de las tres tarjetas de período), el desglose por semana solo incluye las semanas que caen dentro del mes seleccionado.
- "Actividades abiertas" muestra el conteo correcto de `status = 'open'` y, si hay al menos una, la más antigua por `created_at`, con antigüedad nunca negativa (mínimo `0`, mostrado como "Abierta hoy").
- "Inversión: mes actual vs. anterior" no divide por cero cuando el mes anterior es `0`.
- "Ganancia acumulada histórica" y "Margen promedio" no filtran por mes — reflejan el histórico completo.
- "Margen promedio" no divide por cero cuando la inversión histórica es `0`.
- "Ranking de zonas" ordena de mayor a menor ganancia y muestra máx. 5 zonas del mes en curso, con barra proporcional a la primera.
- "Historial de cajas cerradas" muestra hasta 5 cajas, ordenadas de la más reciente a la más antigua (mismo orden que ya devuelve `useCashCuts`).
- Ninguna tarjeta de "Inversión" muestra un valor que en realidad sea ganancia, ni viceversa.
- No existen en el dashboard las tarjetas "Actividad más rentable", "Ticket promedio por actividad" (eliminadas en v3), "Stock valorizado" (eliminada en v4), "Productos con stock bajo", "Productos más vendidos" (eliminadas en v5), ni "Inversión del mes"/"Ganancia del mes" (eliminadas en v6).

## Preguntas abiertas
- Ninguna pendiente en esta versión.
