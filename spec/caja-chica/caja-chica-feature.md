# Caja Chica / Corte de Cuentas Feature

> **⚠️ OBSOLETA (revertida):** el tracking de "costo unitario invertido" (`unitCost`/`unit_cost`) descrito en este documento fue implementado y luego **eliminado por completo** a pedido del usuario — el negocio no vende por unidad con margen (es una máquina de peluches/grúa), no hay costo que trackear por producto ni por línea de actividad. No existe ningún campo de costo en `products` ni en `activity_products`. En el estado actual, **Ganancia = Ingreso (`revenue`, manual) − Subtotal real (`Σ unit_price * sold_qty`)** — no es directamente el ingreso (esa fue una simplificación intermedia, ya superada): Caja Chica acumula por separado el **Subtotal real** (columna `total_revenue` de `cash_cuts`, nombre heredado) y la **Ganancia** (`total_profit`) de cada actividad cerrada. Ver AGENTS.md sección 3 y `spec/activities/activities-feature.md`. Este documento queda solo como referencia histórica del diseño de costo descartado — no implementar nada de lo que describe más abajo.

## Versión
v0-objective-draft

## Objetivo
Permitir saber, en cualquier momento, cuánto dinero real se invirtió comprando stock para las actividades (ferias) y cuánta ganancia real se lleva acumulada desde la última vez que se "cerró la cuenta" — sin tener que sumar actividad por actividad a mano. Se agrega un costo unitario real (invertido) por línea de producto de actividad, una pantalla nueva ("Caja Chica") que acumula invertido/ingresos/ganancia de todas las actividades **cerradas** desde el último corte, un botón para ejecutar el corte (que archiva el período actual como registro histórico y arranca el contador en cero), y un historial de cortes anteriores.

Sigue la misma mecánica mock-primero que el resto del repo (`spec/activities/activities-feature.md`, `spec/products/products-feature.md`): toda la lógica corre contra `localStorage`, lista para reemplazarse por Supabase sin tocar componentes ni hooks públicos.

## Alcance objetivo
- **Costo unitario invertido por línea**: en el formulario de crear/editar actividad (`ActivityFormModal`, ver `spec/activities/activities-feature.md`), cada fila de la tabla de productos seleccionados suma un campo nuevo, editable a mano: **costo unitario** (lo que realmente costó comprar/reponer ese producto para esta actividad — puede coincidir o no con `unit_price`, que es el precio de venta). Se ingresa junto con `initialQty` al agregar el producto a la actividad, y se puede seguir editando mientras la actividad está `open` (mismas reglas de edición que ya aplican a `initialQty`).
  - La columna de la tabla de líneas pasa a mostrar: producto, cantidad (`initialQty`), **costo unitario** (nuevo, editable), precio unitario (venta, ya existente, solo lectura), subtotal invertido (`costoUnitario * initialQty`) y subtotal venta (`unitPrice * initialQty`, ya existente). En mobile (cards), se agrega el costo unitario como un dato más de la card, igual criterio que el resto de los campos de línea.
  - El pie del formulario, además del ya existente "Monto total (inversión)" (que en esta spec pasa a llamarse **"Monto estimado de venta"** para no confundirlo con el invertido real — ver "Brechas detectadas"), suma un nuevo total **"Costo total invertido"**: `Σ costoUnitario * initialQty` de todas las líneas, actualizado en vivo igual que el resto de los totales del formulario.
- **Pantalla nueva "Caja Chica"** (ruta propia, ver "Navegación relevante"), con dos bloques:
  1. **Corte actual** (el período abierto desde el último corte, o desde el origen si nunca se hizo uno): tres métricas destacadas —
     - **Invertido**: `Σ costoUnitario * initialQty` de todas las líneas de todas las actividades **cerradas** que todavía no pertenecen a ningún corte.
     - **Ingresos reales**: `Σ unitPrice * soldQty` de esas mismas líneas (mismo cálculo que "Monto real" en `/actividades`).
     - **Ganancia**: `Ingresos reales - Invertido` (puede dar negativo si se invirtió más de lo que se vendió; se muestra en rojo en ese caso).
     - Debajo, la fecha/hora desde la que se está acumulando el corte actual (fecha del último corte, o "desde el inicio" si nunca hubo uno) y la cantidad de actividades cerradas incluidas en el cálculo.
     - Botón **"Iniciar corte"**, con confirmación previa (dialog), que ejecuta el corte: ver "Reglas objetivo". El botón está **deshabilitado** mientras no haya al menos una actividad cerrada pendiente de corte (invertido/ingresos en $0) — no se puede generar un corte vacío.
  2. **Historial de cortes**: tabla (o cards en mobile, mismo criterio que el resto del repo) con los cortes ya realizados — fecha del corte, cantidad de actividades incluidas, invertido total, ingresos totales, ganancia total —, ordenada del más reciente al más antiguo, sin acción de edición ni borrado (un corte ya hecho es un registro histórico fijo).
- Actividades **abiertas** no participan del cálculo del corte actual (todavía no tienen `soldQty` definitivo) — solo entran al acumulado una vez cerradas, y quedan "flotando" en el corte actual hasta que se ejecute el próximo "Iniciar corte".
- Todo corre contra mock/`localStorage`, sin llamadas de red reales en esta versión.
- **Resumen histórico filtrable**: un tercer bloque en la pantalla "Caja Chica", al final (después de "Corte actual" e "Historial de cortes"), visualmente diferenciado de ambos (panel con borde propio, ver "Vistas afectadas"), que muestra los totales de **Inversión** y **Ganancia** de *todo* el historial de actividades cerradas (sin importar si ya pertenecen a un corte pasado o siguen pendientes en el corte actual) — a diferencia de "Corte actual", que solo mira las pendientes de corte.
  - Se calcula agregando directamente sobre `activities` con `status: 'closed'` — no sobre las filas de `cash_cuts` — porque un corte histórico puede agrupar actividades de varias zonas y fechas distintas, y acá se necesita filtrar por zona y por fecha de forma precisa.
  - **Inversión**: `Σ unitPrice * soldQty` (el mismo cálculo que hoy acumula la columna `total_revenue` de `cash_cuts` — "Subtotal real" — pero mostrado con la etiqueta **"Inversión"** en esta pantalla, sin renombrar la columna ni el campo subyacente).
  - **Ganancia**: `Σ (revenue - unitPrice * soldQty)` de las mismas actividades filtradas (equivalente a `Σ revenue - Inversión`), en rojo si el total da negativo.
  - Filtros disponibles, combinables entre sí: **rango de fecha** (sobre `closedAt` de la actividad, con "desde"/"hasta", ambos opcionales) y **zona** (`zonaId`, select con las zonas existentes + opción "Todas"), mismo componente de filtro por zona que ya usa el listado de `/actividades` (ver AGENTS.md sección "Actividades").
  - **Por defecto**, al entrar a la pantalla o al limpiar los filtros, se muestra el **resumen general** (todas las actividades cerradas, sin filtrar por fecha ni zona) — nunca arranca vacío.
  - Los filtros no afectan a "Corte actual" ni a "Historial de cortes" (bloques independientes) — solo recalculan este resumen.

## Reglas objetivo
- El **costo unitario** de una línea es **obligatorio** y manual: no se autocompleta desde ningún campo del producto (`products` no tiene ni tendrá campo de costo, ver AGENTS.md sección 3) ni desde `unitPrice`. Se valida como número >= 0 (puede ser 0 si el producto fue donado/regalado, pero no negativo ni vacío) — misma mecánica de validación en rojo + bloqueo de submit que ya usa `initialQty`.
- El costo unitario se puede seguir editando mientras la actividad está `open`, igual que `initialQty` — una vez **cerrada**, la línea (incluido su costo unitario) queda de solo lectura, igual que el resto de los campos de una actividad cerrada.
- Una actividad **cerrada** siempre "pertenece" a exactamente un corte una vez que se ejecuta un "Iniciar corte" que la incluya. Antes de eso, no pertenece a ninguno (cuenta para el corte actual, el que todavía está abierto).
- **"Iniciar corte"** (acción irreversible, con confirmación previa):
  1. Toma todas las actividades `closed` que todavía no pertenecen a ningún corte.
  2. Calcula y guarda un registro histórico nuevo (`fecha del corte = now()`, invertido total, ingresos totales, ganancia total, cantidad de actividades incluidas, y el listado de ids de esas actividades).
  3. Marca esas actividades como pertenecientes a este corte (para que no se cuenten de nuevo en el próximo).
  4. El "corte actual" vuelve a `0` de inmediato y empieza a acumular solo con las actividades que se cierren **después** de este momento.
  - Si no hay ninguna actividad cerrada pendiente (invertido = ingresos = ganancia = 0), el botón **"Iniciar corte" queda deshabilitado** — hace falta al menos una actividad cerrada pendiente de corte para poder ejecutarlo. No se generan cortes "vacíos" en el historial.
  - Esta operación es atómica en el mock (una sola función de `features/caja-chica/hooks/api.ts`), mismo criterio que `closeActivity` en `features/activities/hooks/api.ts`.
- Eliminar una actividad cerrada que **ya pertenece a un corte pasado** no modifica el corte histórico (el registro del corte ya quedó fijo con sus totales calculados al momento de cortar) — la spec de Actividades ya cubre que eliminar una cerrada no toca stock; acá se agrega que tampoco se recalculan cortes pasados.
- No hay edición ni borrado de cortes históricos en esta versión.

## Vistas afectadas
- **`ActivityFormModal`** (`spec/activities/activities-feature.md`): tabla/cards de líneas de producto agregan la columna/dato "costo unitario" (editable) y el pie agrega el total "Costo total invertido", conservando el resto del layout sin cambios.
- **Pantalla nueva "Caja Chica"** (`CajaChicaPage`, ruta propia): en desktop, tres bloques apilados verticalmente, en este orden — tarjetas de métricas del corte actual (mismo componente `MetricCard` que usa `spec/dashboard/dashboard-feature.md`, con ícono) arriba; debajo, la tabla de historial de cortes; al final, el bloque de **resumen histórico filtrable**, envuelto en un panel con borde propio (`Card` con estilo distinto, borde punteado + fondo tenue) para que se lea como una sección aparte y no se confunda con "Corte actual" — dentro: controles de filtro de fecha/zona sobre un recuadro propio, y las mismas `MetricCard` de Inversión/Ganancia (con ícono en un color distinto al de "Corte actual"), recalculadas según el filtro activo. En mobile, mismo orden, tarjetas apiladas y el historial como cards (mismo criterio responsive que el resto del repo: tabla en `md+`, cards por debajo).
- **`ActivityFillModal`**: el costo unitario no se edita acá (solo se define/edita en crear/editar, mientras la actividad está abierta), pero al confirmar **"Cerrar actividad"** el pie del modal agrega, junto a "Monto estimado" y "Monto real" (ya existentes), dos totales nuevos de **esa actividad puntual**: **"Invertido"** (`Σ unitCost * initialQty` de sus líneas) y **"Ganancia"** (`Monto real - Invertido`, en rojo si da negativo) — recalculados en vivo mientras se edita `soldQty`, igual que ya se recalcula "Monto real". Así, en el momento de cerrar la feria ya se ve cuánto dejó esa actividad en particular, antes de que se sume al acumulado de Caja Chica.

## Política de estado
- El cálculo del "corte actual" (invertido/ingresos/ganancia acumulados) va por TanStack Query (`useCajaChicaActual` en `features/caja-chica/hooks/`), derivado de `useActivities` filtrando `status: 'closed'` y `cutId: null` — se recalcula solo, sin estado propio, cada vez que se invalida `['activities']` (por ejemplo al cerrar una actividad nueva).
- El historial de cortes va por `useCashCuts` (TanStack Query, `queryKey: ['cash-cuts']`).
- El resumen histórico filtrable va por `useCajaChicaResumen({ dateFrom, dateTo, zonaId })` (TanStack Query, `queryKey: ['caja-chica-resumen', { dateFrom, dateTo, zonaId }]`), derivado de `useActivities` filtrando `status: 'closed'` y aplicando los filtros activos en memoria (sin filtro = todas las cerradas). Los filtros viven como estado local de la pantalla (no se persisten en URL ni en `localStorage` en esta versión). Se recalcula solo al invalidarse `['activities']`, igual que "Corte actual".
- "Iniciar corte" es una mutación (`useCreateCashCut`) que invalida `['activities']` y `['cash-cuts']` al completarse, para que el corte actual vuelva a `0` y el historial muestre el nuevo registro sin recargar la página.
- El costo unitario dentro del formulario de actividad es estado local del formulario (Formik), igual que `initialQty` — no se escribe nada hasta el submit final.

## Contratos de datos
- **`ActivityProductLine`** (`src/shared/types/activity.ts`) agrega el campo **`unitCost`** (number, requerido, >= 0) junto a los ya existentes `unitPrice`, `initialQty`, `soldQty`.
- **Nueva entidad `CashCut`**: `{ id, closedAt (fecha del corte), totalInvested, totalRevenue, totalProfit, activitiesCount, activityIds: string[] }`.
- **`Activity`** (`src/shared/types/activity.ts`) agrega el campo **`cutId: string | null`** (default `null`), seteado al id del `CashCut` que la incluyó, una vez que se ejecuta un corte que la abarca.
- Semilla mock nueva: `src/shared/data/mock-cash-cuts.json` (array vacío o con algún corte de ejemplo, a definir al implementar) + copia mutable en `localStorage` bajo la clave `peluchera_stock_mock_cash_cuts`.
- Schema de validación: se extiende `src/features/activities/schemas/activity.schema.ts` (`activitySchema`) para que cada línea de producto valide también `unitCost` (número >= 0, requerido) — no se crea un schema nuevo para esto, ya que vive dentro del mismo formulario de actividad.
- `src/features/caja-chica/hooks/api.ts` expone `fetchCurrentCut` (agrega sobre actividades `closed` con `cutId: null`), `fetchCashCuts` (historial), y `createCashCut()` — esta última hace, en una sola operación mock atómica: calcular totales, escribir el nuevo registro en `peluchera_stock_mock_cash_cuts`, y setear `cutId` en cada actividad incluida dentro de `peluchera_stock_mock_activities`.

## Persistencia
- Cortes históricos: `localStorage`, clave `peluchera_stock_mock_cash_cuts` — mecanismo temporal, se reemplaza por una tabla `cash_cuts` en Supabase el día que se conecte (con una función/RPC atómica equivalente a `createCashCut`, mismo criterio que el cierre de actividades en AGENTS.md sección 3).
- `unitCost` y `cutId` viven dentro del mismo `localStorage` que ya usa `features/activities` (`peluchera_stock_mock_activities`) — no requieren almacenamiento separado.

## Errores esperados y recuperación
- Intentar agregar/editar una línea de producto con `unitCost` vacío, no numérico o negativo: la línea se marca en rojo y bloquea el submit del formulario de actividad, igual que ya ocurre con `initialQty` — al salir del campo con un valor inválido, toast de error puntual.
- "Iniciar corte" exitoso: toast de éxito ("Corte realizado. Se archivaron N actividades.") y el corte actual vuelve a mostrar $0 en las tres métricas de inmediato.
- Cancelar el dialog de confirmación de "Iniciar corte" no ejecuta nada ni modifica `localStorage`.
- En esta versión no se simulan errores aleatorios, mismo criterio que el resto de los mocks del repo.

## Navegación relevante
- Ruta nueva `/caja-chica` (dentro del `AppLayout`, junto a `/actividades`, `/productos`, `/` del dashboard), con su entrada correspondiente en el menú de navegación de la app.
- Sin vista de detalle por corte individual en esta versión — el historial muestra los totales agregados de cada corte en una sola fila/card, sin drill-down a las actividades incluidas. *(Ver "Preguntas abiertas".)*

## Profundidad en Supabase
- No aplica en esta iteración: todo corre contra mock/`localStorage`, igual que `features/activities`. La migración a Supabase (tabla `cash_cuts`, columna `unit_cost` en `activity_products`, columna `cut_id` en `activities`, y una función/RPC atómica para "iniciar corte") se documentará en una spec de cambio aparte cuando corresponda, mismo criterio ya usado para Actividades y Productos.

## Brechas detectadas en la implementación actual
- El total que hoy se llama **"Monto total (inversión)"** en el pie de `ActivityFormModal` (`spec/activities/activities-feature.md:19`) en realidad es `Σ unit_price * initial_qty` — es decir, el monto de **venta** estimado, no una inversión real. Esta spec lo renombra a **"Monto estimado de venta"** para no pisar el significado nuevo de "invertido" (que ahora sí representa costo real). Es un cambio de copy/label sobre una feature ya spec'eada, a tener en cuenta al implementar.
- No existe hoy ningún campo de costo en `products` ni en `activity_products` (AGENTS.md sección 3 lo aclara explícitamente) — `unitCost` es un campo enteramente nuevo, introducido por esta spec, y vive únicamente a nivel de línea de actividad (no a nivel de producto), porque el costo real puede variar de una compra a otra aunque sea el mismo producto.

## Criterios de aceptación
- Agregar un producto a una actividad (crear o editar mientras está `open`) exige un `unitCost` válido (>= 0) además de `initialQty` — no se puede guardar la línea sin él.
- El pie del formulario de actividad muestra en vivo "Costo total invertido" (`Σ unitCost * initialQty`) y "Monto estimado de venta" (`Σ unitPrice * initialQty`), recalculados mientras se agregan/editan/quitan líneas.
- La pantalla "Caja Chica" muestra, para el corte actual, exactamente la suma de `costoUnitario * initialQty` (invertido) y `unitPrice * soldQty` (ingresos) de todas las actividades `closed` con `cutId: null`; la ganancia es la resta de ambos y se pinta en rojo si es negativa.
- Actividades `open` no afectan ninguna de las tres métricas del corte actual.
- El botón "Iniciar corte" está deshabilitado mientras no haya al menos una actividad cerrada pendiente de corte; se habilita apenas se cierra la primera actividad pendiente.
- Presionar "Iniciar corte" (con confirmación) crea un nuevo registro en el historial con los totales correctos, marca todas las actividades cerradas pendientes con el `cutId` de ese corte, y el corte actual vuelve a mostrar $0/0 actividades (y el botón vuelve a deshabilitarse) de inmediato.
- Al confirmar "Cerrar actividad" en `ActivityFillModal`, el pie muestra correctamente "Invertido" (`Σ unitCost * initialQty`) y "Ganancia" (`Monto real - Invertido`) de esa actividad, recalculados en vivo mientras se edita cualquier `soldQty` antes de confirmar.
- El historial de cortes lista todos los cortes anteriores ordenados del más reciente al más antiguo, con sus totales fijos (no se recalculan si después se edita o elimina una actividad ya incluida en ese corte).
- Cerrar una actividad nueva después de un corte la suma al corte actual (no al histórico ya cerrado).
- Cancelar el dialog de "Iniciar corte" no crea ningún registro ni modifica `cutId` de ninguna actividad.
- Ningún campo de validación de `unitCost` se duplica fuera de `activity.schema.ts`.
- Ningún archivo de esta feature importa `@supabase/supabase-js` ni el cliente `supabase` en esta versión.
- Al entrar a "Caja Chica" (o al limpiar los filtros), el bloque de resumen histórico muestra Inversión y Ganancia de **todas** las actividades cerradas, sin filtrar.
- Aplicar un filtro de rango de fecha, de zona, o ambos combinados, recalcula Inversión y Ganancia usando solo las actividades cerradas cuya `closedAt`/`zonaId` cumplen el filtro — sin afectar las métricas de "Corte actual" ni el historial de cortes.
- Una actividad cerrada que ya pertenece a un corte pasado sigue contando en el resumen histórico filtrable (a diferencia de "Corte actual", que solo cuenta las pendientes de corte).
- La Ganancia del resumen se pinta en rojo cuando el total da negativo, mismo criterio que el resto de las métricas de ganancia de esta feature.

## Preguntas abiertas
- Ninguna pendiente en esta versión — las 4 dudas de diseño (bloqueo de corte vacío, drill-down del historial, alcance de la ganancia, y visibilidad del invertido al cerrar) quedaron resueltas y reflejadas en "Reglas objetivo" y "Vistas afectadas".
