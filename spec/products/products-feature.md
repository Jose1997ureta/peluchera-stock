# Products Feature

## Versión
v0-objective-draft

## Objetivo
Permitir administrar el catálogo de productos (juguetes/peluches) con un CRUD completo: listar en tabla, crear, editar y eliminar (individual o en bulk) — simulado por completo contra un JSON mock en `shared/data/`, sin Supabase por ahora, con la misma mecánica ya usada en `spec/auth/login-feature.md`: la UI y los hooks no cambian el día que se conecte Supabase, solo la implementación interna de `features/products/hooks/api.ts`.

## Alcance objetivo
- Ruta `/productos` (dentro del `AppLayout`, ver `spec/dashboard/dashboard-feature.md`) muestra dos tabs sobre la misma tabla: **"Activos"** (default al entrar) y **"Desactivados"**. Cada tab filtra por `isActive` y mantiene su propia búsqueda/orden/página/selección — cambiar de tab no arrastra el estado del otro.
- Columnas (mismas en ambos tabs): contador de fila (`#`, número secuencial según orden/página actual, no persiste ni es un id), imagen, nombre, precio, stock, acciones. La tabla solo muestra el número de stock, sin ningún badge o anotación de "stock bajo" — esa alerta vive únicamente en la métrica del dashboard (`LOW_STOCK_THRESHOLD`, ver `spec/dashboard/dashboard-feature.md`), no en el listado de productos.
- Checkbox de selección por fila + checkbox "seleccionar todos" en el header de la tabla actual (no selecciona filas fuera de la página/vista cargada, ni del otro tab).
- Botón "Crear producto" (arriba de la tabla, visible en ambos tabs) abre un modal (`center-morph-modal` de beUI) con el formulario de producto. El mismo modal y el mismo formulario se reutilizan para editar (prefilled con los datos del producto). Un producto se crea siempre activo.
- Búsqueda por nombre (input arriba de la tabla, filtra en tiempo real) y orden por columna (nombre, precio, stock) usando el sorting nativo del componente `table` de beUI.
- Paginación: 15 productos por página por defecto.
- Acciones por fila en el tab Activos: **Editar**, **Desactivar** y **Eliminar** — Desactivar y Eliminar abren cada uno su propio dialog de confirmación antes de ejecutarse.
- Acciones por fila en el tab Desactivados: **Editar**, **Activar** y **Eliminar** — Activar y Eliminar también piden confirmación. Eliminar sigue disponible ahí, no hace falta reactivar antes de poder borrar.
- Acciones bulk (con 1+ filas seleccionadas aparece la cantidad seleccionada junto a un botón **"Acciones"** que despliega un menú, en vez de un botón por acción):
  - Tab Activos: el menú tiene **"Desactivar seleccionados"** y **"Eliminar seleccionados"**, ambas con dialog de confirmación mostrando cuántos productos se van a desactivar/eliminar.
  - Tab Desactivados: el menú tiene **"Activar seleccionados"** y **"Eliminar seleccionados"**, mismo patrón de confirmación.
- El dialog de confirmación es el mismo componente para las tres acciones (Activar/Desactivar/Eliminar), cambiando solo el texto y el verbo del botón de confirmar según la acción y la cantidad de productos afectados (singular/plural).
- Formulario de producto, en este orden: `nombre`, `precio` (numérico, admite decimales, ej. `1234.50`), `stock` (numérico entero), y por último `imagen` (una sola, con preview más grande que la miniatura de la tabla, antes de "subir"). El campo de imagen ofrece dos botones equivalentes para cargarla: **"Subir archivo"** (selector de archivos estándar) y **"Tomar foto"** (mismo selector con `capture="environment"`, que en un celular abre la cámara trasera directo; en desktop, sin cámara disponible, cae al mismo selector de archivos). Con una imagen ya cargada, solo se muestra el botón de quitarla (ícono `X`) — para reemplazarla hay que quitar la actual y volver a subir/tomar una nueva. El estado activo/desactivado **no** se edita desde el formulario — solo desde las acciones de la tabla.
- Todo el CRUD (crear, editar, eliminar, activar/desactivar, listar con búsqueda/orden/paginación) opera contra datos mock — no hay llamadas de red reales en esta versión.

## Reglas objetivo
- `precio` es un valor decimal (moneda, 2 decimales) y `stock` es un entero — no se permiten decimales en `stock`. Esta regla vive en el schema de Yup, no se duplica a mano en el JSX.
- `nombre`, `precio` y `stock` son requeridos para crear o editar un producto (`imagen` es opcional). El producto no tiene campo `descripción` — se sacó a pedido explícito del usuario, no reintroducirlo sin que se pida de nuevo. `precio` debe ser **mayor a 0** y `stock` debe ser **como mínimo 1** — no se puede registrar un producto con precio o stock en `0` (si el stock llega a `0` más adelante por ventas, eso sí es válido; la regla de mínimo 1 aplica solo al crear/editar desde el formulario).
- Los precios se manejan en una sola moneda: **soles (PEN)**.
- Un producto tiene **una sola imagen** (`imageUrl`), no una galería. Subir una imagen nueva reemplaza a la anterior. En la implementación real contra Supabase Storage (bucket `product-images`), reemplazar la imagen borra el objeto anterior del bucket (no queda huérfano); eliminar un producto (individual o en bulk) también borra su imagen asociada del bucket, además de la fila de la tabla `products`.
- Límite de la imagen: hasta **5 MB**, formatos `jpg`/`jpeg`/`png`/`webp` (placeholder — confirmar con el usuario si hace falta ajustarlo). Esto aplica igual en la versión mock, para no tener que revalidar nada al migrar a Storage.
- No se valida unicidad de `nombre` en esta versión (dos productos pueden llamarse igual).
- `isActive` (booleano, default `true`) determina si el producto aparece en el tab Activos o en el de Desactivados. Desactivar/activar es reversible, pero igual que Eliminar pasa por un dialog de confirmación antes de ejecutarse — ninguna de las tres acciones se dispara directo desde el botón/ítem de menú.
- Los productos desactivados **no** cuentan para la métrica "Productos con stock bajo" del dashboard (ver `spec/dashboard/dashboard-feature.md`).
- La regla de negocio "no se puede eliminar un producto que ya fue usado en una actividad" (`AGENTS.md` sección 3, futura tabla `activity_products`) **no se simula todavía**, porque el feature de Actividades no existe ni siquiera como mock: en esta versión, eliminar un producto siempre está permitido. Cuando exista mock (o Supabase real) de actividades, esta spec se revisa para agregar la validación — no antes, para no inventar una relación con datos que no existen.

## Vistas afectadas
- **Listado**: por debajo de `md` se muestra como **cards apiladas** (una por producto) en vez de tabla — decisión revisada respecto al borrador original (que planteaba la misma tabla con scroll horizontal en mobile), porque el público de esta app usa mayormente mobile. En `md` y superior se mantiene la tabla (`table` de beUI, con scroll horizontal si hace falta). Cada card mobile muestra: checkbox de selección (mismo mecanismo bulk que la tabla), miniatura, nombre (con salto de línea si no entra, sin truncar), precio (con ícono) y stock (con ícono), con un acento de color lateral (violeta si tiene stock, rojo si `stock === 0`) — sin ningún badge de "stock bajo" ni "con/sin stock" (esa alerta sigue viviendo solo en la métrica del dashboard, ver regla de la sección "Reglas objetivo"). Las acciones de fila (Editar/Activar-Desactivar/Eliminar) se agrupan detrás de un botón de menú (ícono de 3 puntos, `MoreVertical`) en vez de mostrarse como botones sueltos — la tabla de desktop sí conserva un botón de ícono por acción.
- El modal de crear/editar (`center-morph-modal`) es el mismo en ambos breakpoints, según lo decidido para esta versión — no tiene tabla de líneas, así que no aplica el criterio de cards.

## Política de estado
- Listado, creación, edición, activar/desactivar y borrado de productos van por TanStack Query (`useProducts`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, `useSetProductActive`, `useBulkDeleteProducts`, `useBulkSetProductsActive` en `features/products/hooks/`), igual que si ya hablaran con Supabase — solo que `features/products/hooks/api.ts` internamente lee/escribe el mock en vez de llamar a `supabase`.
- Qué tab está activo, búsqueda, orden y página actual de la tabla: estado local del componente de la página, uno independiente por tab (no se persiste entre sesiones).
- Selección de filas: estado local por tab, se limpia al cambiar de tab/página o al completarse una acción bulk.
- El formulario de producto usa Formik + el schema de Yup de `features/products/schemas/product.schema.ts` como única fuente de verdad de validación.
- La imagen se procesa a `data URL` (base64, vía `FileReader`) recién al confirmar el submit del formulario — mientras tanto solo se muestra su preview local (`URL.createObjectURL`). Ese `data URL` es lo que se guarda como `imageUrl` en el mock.

## Contratos de datos
- Semilla mock: `src/shared/data/mock-products.json` — array de productos con la forma `{ id, name, price, stock, imageUrl, isActive, createdAt, updatedAt }`, igual forma que tendrá la tabla `products` real de `AGENTS.md` sección 3 (en camelCase porque es JSON de cliente, no la fila de Postgres). Todos los productos de la semilla arrancan con `isActive: true`.
- Copia mutable: `localStorage`, clave `peluchera_stock_mock_products`. Al primer acceso, si la clave no existe, se siembra copiando `mock-products.json`; a partir de ahí, todo create/update/delete/activar/desactivar lee y escribe esa copia — el archivo JSON del repo nunca se modifica en tiempo de ejecución (no se puede, es parte del bundle).
- Schema de validación: `src/features/products/schemas/product.schema.ts` (Yup) — `name`: requerido; `price`: requerido, numérico, > 0; `stock`: requerido, entero, >= 1; `image`: archivo opcional (o `imageUrl` existente en edición), máx. 5 MB, formatos permitidos. `isActive` no forma parte de este schema (no se edita desde el formulario).
- `src/features/products/hooks/api.ts` expone las mismas funciones que tendrá el día de Supabase (`fetchProducts` con filtro `isActive`, `createProduct`, `updateProduct`, `deleteProduct`, `setProductActive`, `bulkDeleteProducts`, `bulkSetProductsActive`), pero implementadas contra el mock de `localStorage`. Cada función simula una latencia mínima (ej. 300–500 ms) para que los estados de loading de la UI se puedan probar de forma realista.

## Persistencia
- Productos: `localStorage` (clave `peluchera_stock_mock_products`), mecanismo temporal e intencional — se reemplaza 1:1 por Supabase el día que se conecte, sin tocar los hooks que consumen `features/products/hooks/`.
- Guardar la imagen como `data URL` en `localStorage` es aceptable únicamente porque es data mock de desarrollo (mismo criterio que ya se documenta para `mock-users.json` en `shared/data/README.md`) — esta forma de guardar imágenes deja de existir en cuanto se conecte Supabase Storage.

## Errores esperados y recuperación
- Falla simulada al cargar/crear/editar/eliminar (si se agrega una probabilidad de error simulado más adelante): estado de error con botón "Reintentar", igual que en el dashboard. En esta versión no se simulan errores aleatorios — el mock siempre resuelve exitosamente salvo error real de programación.
- Formulario con campos inválidos (Yup): mismo patrón que en Login — el input se marca visualmente en rojo, sin texto de error debajo, y el submit queda bloqueado.
- Crear/editar/eliminar/activar/desactivar exitoso: toast de éxito correspondiente ("Producto creado.", "Producto actualizado.", "Producto eliminado." / "N productos eliminados.", "Producto desactivado." / "N productos desactivados.", "Producto activado." / "N productos activados.").

## Navegación relevante
- Ruta `/productos` ya registrada en `src/app/routes.tsx` (placeholder) — esta spec la reemplaza por la implementación real (mock).
- No hay una vista de detalle de producto en esta versión (todo se gestiona desde la tabla + el modal).

## Profundidad en Supabase
- No aplica en esta iteración: todo el CRUD de productos es mock, contra `localStorage` sembrado desde `shared/data/mock-products.json`. La migración a Supabase (tabla `products` con `image_url` e `is_active`, bucket de Storage, regla de bloqueo de borrado por `activity_products`) se documentará en una spec de cambio (`spec/products/migrate-to-supabase-spec-review.md`) cuando corresponda, igual que quedó planteado para Auth.

## Brechas detectadas en la implementación actual
- Ninguna detectada — la implementación actual de `/productos` coincide con esta spec.

## Criterios de aceptación
- El tab Activos muestra solo productos con `isActive: true`; el tab Desactivados muestra solo los `isActive: false`. Ambos con las mismas columnas, y el stock siempre como número simple, sin badge.
- Buscar por nombre filtra la tabla del tab activo en tiempo real; hacer click en el header de precio o stock ordena esa columna asc/desc.
- Crear un producto con nombre, precio, stock e imagen válidos lo agrega al tab Activos (siempre nace activo), muestra el toast de éxito, y persiste en `localStorage` (sigue estando ahí después de recargar la página).
- Intentar crear/editar un producto sin `nombre`, con `precio` en `0` (o vacío/no numérico) o con `stock` en `0` (o vacío/no numérico) marca esos campos en rojo y bloquea el submit — no se permite guardar.
- Editar un producto precarga sus datos actuales (incluida la imagen existente) en el mismo modal, y guardar los cambios los refleja en la tabla y en `localStorage`, sin cambiar su `isActive`.
- Desactivar un producto (individual o en bulk) muestra el dialog de confirmación; al confirmar, lo saca del tab Activos y lo hace aparecer en el tab Desactivados. Cancelar el dialog no cambia nada.
- Activar un producto desde el tab Desactivados (individual o en bulk) también muestra el dialog de confirmación; al confirmar, lo devuelve al tab Activos.
- Un producto desactivado con `stock < LOW_STOCK_THRESHOLD` no aparece en la métrica "Productos con stock bajo" del dashboard.
- Eliminar un producto (individual o en bulk, desde cualquiera de los dos tabs) muestra el dialog de confirmación; al confirmar, lo quita de la tabla y de `localStorage`. En esta versión no hay ningún producto "bloqueado" para borrar.
- Cerrar cualquiera de los tres dialogs de confirmación sin confirmar (botón "Cancelar", click afuera, o Esc) no ejecuta la acción ni modifica `localStorage`.
- Ningún campo de validación (nombre, precio, stock, tamaño/formato de imagen) se duplica fuera de `product.schema.ts`.
- Ningún archivo de esta feature importa `@supabase/supabase-js` ni el cliente `supabase` — toda la implementación mock vive aislada en `features/products/hooks/api.ts`, lista para reemplazarse sin tocar componentes ni hooks públicos.
- Por debajo de `md`, el listado se ve como cards (checkbox, miniatura, nombre, precio, stock, sin badge) con las acciones detrás de un menú de 3 puntos; en `md` y superior se ve la tabla con un botón por acción. Seleccionar productos desde las cards habilita el mismo menú de acciones bulk que la selección desde la tabla.

## Preguntas abiertas
Ninguna pendiente en esta versión.
