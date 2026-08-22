# Caja Chica Feature

> **⚠️ Nota sobre versiones previas de esta spec:** el tracking de "costo unitario invertido" (`unitCost`/`unit_cost`) descrito en versiones anteriores fue implementado y luego **eliminado por completo** a pedido del usuario — el negocio no vende por unidad con margen (es una máquina de peluches/grúa), no hay costo que trackear por producto ni por línea de actividad. No existe ningún campo de costo en `products` ni en `activity_products`. Tampoco existe ya el concepto de "Iniciar corte" retroactivo (que archivaba de una todas las actividades cerradas pendientes) — fue reemplazado por el modelo de **caja con apertura/cierre** que describe este documento. Ver AGENTS.md sección 3 y `spec/activities/activities-feature.md`.

## Versión
v1-apertura-cierre-caja

## Objetivo
Llevar el control de una **caja chica** con ciclo de vida explícito: se **abre** con un monto inicial, mientras está abierta acumula automáticamente el subtotal real y la ganancia de cada actividad que se va cerrando, y se **cierra** cuando el usuario decide — sin tener que ingresar ningún monto de cierre a mano, porque todo ya se calculó solo a partir de las actividades. Además, cerrar una actividad en `/actividades` pasa a requerir que haya una caja abierta: es la forma en que se garantiza que ninguna venta quede fuera de una caja.

## Alcance
- **Pantalla "Caja Chica"** (ruta `/caja-chica`), dividida en dos sub-pestañas (mismo componente `Tabs` que ya usa `/actividades`, `variant="pill"`):
  1. **"Caja Chica"** (pestaña por defecto): el ciclo de vida de la caja actual + el historial de cajas ya cerradas.
  2. **"Historial"**: el resumen filtrable por fecha/zona sobre *todas* las actividades cerradas (ver "Resumen histórico" más abajo) — bloque que ya existía, sin cambios de lógica, solo se muda a su propia pestaña.
- **Apertura de caja**: cuando no hay ninguna caja abierta, la pestaña "Caja Chica" muestra un formulario simple — **monto inicial** (numérico, obligatorio, `>= 0`) — y un botón **"Abrir caja"**. No hay selector de moneda (la app opera en una sola moneda). Confirmar abre la caja de inmediato (sin dialog de confirmación previo: abrir caja no es una acción destructiva).
- **Caja abierta**: mientras hay una caja abierta, la pestaña muestra:
  - Encabezado con la fecha/hora de apertura y el monto inicial ingresado.
  - Dos métricas destacadas (mismo componente `MetricCard` que ya se usaba) — **Subtotal real** (`Σ unit_price * sold_qty`) y **Ganancia** (`Σ (revenue - subtotal_real)`) — de todas las actividades cerradas mientras esta caja estuvo abierta. Se recalculan solas cada vez que se cierra una actividad nueva.
  - Botón **"Cerrar caja"**, con dialog de confirmación previo (acción irreversible): al confirmar, la caja pasa a cerrada con los totales ya calculados (no se piden montos de cierre — a diferencia del mockup de referencia que inspiró esta feature, acá no aplica un "monto final" manual, porque el sistema ya sabe exactamente cuánto entró por las actividades).
- **Historial de cajas**: debajo del bloque anterior, tabla (o cards en mobile) con las cajas ya cerradas — fecha de apertura, fecha de cierre, monto inicial, cantidad de actividades incluidas, subtotal real y ganancia —, ordenada de la más reciente a la más antigua, sin acción de edición ni borrado.
- **Validación obligatoria al cerrar una actividad** (ver `spec/activities/activities-feature.md`, sección "Cerrar una actividad"): `ActivityFillModal` no deja cerrar una actividad sin caja abierta. Si al confirmar "Cerrar actividad" no hay caja abierta, se apila sobre el mismo modal un formulario chico de "abrir caja" (mismo campo de monto inicial descrito arriba, reutilizado como componente) en vez de redirigir a `/caja-chica` — así no se pierde lo ya cargado en el formulario de cierre. Al confirmar la apertura ahí, el cierre de la actividad se ejecuta automáticamente con los valores ya cargados.
- **Resumen histórico** (pestaña "Historial", sin cambios de lógica respecto a la versión anterior): totales de **Inversión** (`Σ unit_price * sold_qty`) y **Ganancia** (`Σ (revenue - unit_price * sold_qty)`) de *todas* las actividades cerradas, sin importar a qué caja pertenezcan (o si todavía no pertenecen a ninguna caja cerrada) — filtrable por rango de fecha (`closedAt`) y por zona, combinables. Por defecto (sin filtros) muestra el total general.

## Reglas objetivo
- **Nunca puede haber dos cajas abiertas a la vez** — se garantiza a nivel de base de datos (índice único parcial sobre `status = 'open'`). Intentar abrir una caja mientras ya hay una abierta falla con un error explícito.
- **Abrir caja**:
  1. Se ingresa un monto inicial (`>= 0`, puede ser `0`).
  2. Se crea un registro nuevo con `openedAt = now()`, el monto inicial, y subtotal real / ganancia / cantidad de actividades en `0` (todavía no acumuló nada).
  3. A partir de este momento, toda actividad que se cierre queda asociada a esta caja.
- **Cerrar una actividad exige una caja abierta**: es una regla del cierre (`close_activity`), no del llenado — se puede seguir editando `revenue` y `sold_qty` sin caja abierta, pero el cierre efectivo falla si no la hay. La actividad recién cerrada queda asociada a la caja abierta en ese momento (no a una que se abra después).
- **Cerrar caja** (acción irreversible, con confirmación previa):
  1. Toma todas las actividades asociadas a la caja abierta actual (las que se cerraron mientras estuvo abierta).
  2. Calcula subtotal real y ganancia definitivos sobre esas actividades (mismo cálculo que ya se mostraba en vivo mientras la caja estaba abierta).
  3. Marca la caja como cerrada (`closedAt = now()`) con esos totales ya fijos — pasa a listarse en "Historial de cajas".
  4. No hay ningún campo de monto de cierre a ingresar a mano: todo sale de sumar las actividades.
  - A diferencia de la versión anterior de esta feature, **no** existe un botón deshabilitado por "no hay actividades pendientes" — se puede cerrar una caja aunque no haya recibido ninguna actividad todavía (queda un registro con subtotal real y ganancia en `0`).
- Una actividad cerrada que ya pertenece a una caja cerrada no se recalcula si después se elimina o se edita otra actividad (los totales de una caja cerrada quedan fijos al momento del cierre, igual criterio que las demás operaciones irreversibles del repo).
- El **resumen histórico** (pestaña "Historial") sigue sin distinguir a qué caja pertenece cada actividad — agrega directamente sobre `activities` con `status: 'closed'`, filtrando por fecha/zona, sin pasar por el concepto de caja.
- No hay edición ni borrado de cajas ya cerradas en esta versión.

## Vistas afectadas
- **`CajaChicaPage`**: pasa de un único bloque vertical a dos pestañas (`Tabs`, mismo patrón visual que `ActivitiesPage`):
  - Pestaña **"Caja Chica"**: formulario de apertura (sin caja abierta) o encabezado + `MetricCard` de Subtotal real/Ganancia + botón "Cerrar caja" (con caja abierta), y debajo la tabla/cards de "Historial de cajas" (agrega la columna "Monto inicial" respecto a la vieja "Historial de cortes").
  - Pestaña **"Historial"**: el contenido que antes era el bloque "Resumen histórico" (filtros Desde/Hasta/Zona + `MetricCard` de Inversión/Ganancia), ahora ocupa toda la pestaña — ya no necesita el `Card` de borde punteado que antes lo diferenciaba visualmente del resto de la página, porque ahora vive en su propio espacio.
- **`ActivityFillModal`**: si al confirmar "Cerrar actividad" no hay caja abierta, se apila sobre el mismo modal un formulario chico de "abrir caja" (mismo componente reutilizable de apertura), en vez de bloquear con solo un mensaje de error o redirigir fuera del modal. Al abrir la caja ahí, el cierre de la actividad continúa automáticamente con los datos ya cargados en el formulario.

## Política de estado
- El estado de la **caja actual** (abierta/ninguna, monto inicial, subtotal real y ganancia acumulados en vivo) va por TanStack Query (`useCurrentCashCut`, `queryKey: ['cash-cuts', 'current']`), recalculado cada vez que se invalida `['cash-cuts']` o `['activities']` (por ejemplo, al cerrar una actividad nueva).
- **"Abrir caja"** es una mutación (`useOpenCashCut`) que invalida `['cash-cuts']`.
- **"Cerrar caja"** es una mutación (`useCloseCashCut`) que invalida `['cash-cuts']` y `['activities']`.
- El historial de cajas cerradas va por `useCashCuts` (`queryKey: ['cash-cuts', 'history']`), sin cambios respecto a la versión anterior salvo que ahora solo trae cajas con `status: 'closed'`.
- El resumen histórico filtrable va por `useHistoricalSummary({ dateFrom, dateTo, zonaId })` (`queryKey: ['caja-chica-resumen', filters]`), sin cambios de lógica. Los filtros viven como estado local de la pestaña "Historial" (no se persisten en URL ni entre sesiones).
- `ActivityFillModal` consulta `useCurrentCashCut()` para decidir si hay que interceptar el cierre con el formulario de apertura, y usa `useOpenCashCut()` para abrir la caja inline sin salir del modal.

## Contratos de datos
- **`CashCut`** (`src/shared/types/cashCut.ts`): `{ id, status: 'open' | 'closed', initialAmount, openedAt, closedAt: string | null, totalRevenue, totalProfit, activitiesCount, activityIds: string[] }`.
- **`Activity`** conserva el campo `cutId: string | null` que ya tenía, pero ahora se setea **en el momento de cerrar la actividad** (dentro de `close_activity`), no en un paso posterior de "corte" — apunta a la caja que estaba abierta en ese momento.
- Base de datos (Supabase): tabla `cash_cuts` reutilizada (no se renombra) con columnas nuevas `status`, `initial_amount`, `opened_at` (además de las ya existentes `closed_at`, `total_revenue`, `total_profit`, `activities_count`, `activity_ids`), más un índice único parcial que garantiza como máximo una fila `status = 'open'` a la vez.
- Funciones/RPC atómicas (`security definer`, mismo patrón que el resto de operaciones de escritura del repo, AGENTS.md sección 3): `open_cash_cut(p_initial_amount)`, `close_cash_cut()`, y `close_activity(...)` modificada para exigir y asociar la caja abierta al cerrar una actividad. La función anterior `create_cash_cut()` (corte retroactivo "todo o nada") queda eliminada.

## Errores esperados y recuperación
- Intentar abrir una caja mientras ya hay una abierta: error explícito, no se crea una segunda fila — en la práctica no debería poder dispararse desde la UI porque el formulario de apertura solo se muestra cuando no hay caja abierta, pero la garantía real vive en la base de datos (índice único parcial).
- Intentar cerrar una actividad sin caja abierta: el cierre no se ejecuta; en su lugar se muestra el formulario de apertura apilado sobre `ActivityFillModal`, sin perder los datos ya cargados. Una vez abierta la caja, el cierre de la actividad se reintenta solo.
- Intentar cerrar la caja actual sin que haya caja abierta (no debería ser alcanzable desde la UI, el botón solo aparece con caja abierta): error explícito del RPC.
- Cancelar el dialog de confirmación de "Cerrar caja" no ejecuta nada ni modifica ningún dato.

## Navegación relevante
- Ruta `/caja-chica` (sin cambios), ahora con dos sub-pestañas internas en vez de bloques apilados.

## Preguntas abiertas
- Ninguna pendiente en esta versión.
