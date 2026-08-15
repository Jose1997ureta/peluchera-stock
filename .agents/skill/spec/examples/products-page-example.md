# Ejemplo — modo `create` (page spec)

> Documento de ejemplo. Muestra el formato de una page spec creada desde cero, con placeholders donde faltan decisiones. No es la spec vigente de Productos.

---

# Products Page

## Versión
v0-objective-draft

## Objetivo
Listar el catálogo de productos (juguetes y peluches) y permitir crear, editar y eliminar productos.

## Ubicación y acceso
- Archivo: `src/features/products/ProductsPage.tsx`
- Ruta: `/productos` registrada en `src/app/routes.tsx`, protegida por sesión de Supabase Auth.
- Acceso: requiere sesión activa. Sin sesión, redirige a `/login`.

## Alcance objetivo
- Listar productos con nombre, precio, stock, descripción e imagen.
- Crear un producto nuevo mediante formulario.
- Editar un producto existente.
- Eliminar un producto.
- Indicar visualmente los productos con stock bajo (umbral definido en `AGENTS.md`).

## Estados UI objetivo
- `loading`: skeleton mientras carga la lista.
- `empty`: sin productos registrados, muestra CTA para crear el primero.
- `error`: falla la consulta a Supabase, muestra mensaje y botón de reintentar.
- `content`: lista de productos en tarjetas o tabla (componentes de beUI).

## Eventos objetivo
- Tocar "Nuevo producto": abre formulario de creación.
- Tocar una tarjeta/fila: abre formulario de edición con los datos precargados.
- Tocar "Eliminar": `Pendiente por definir.` (confirmar si pide confirmación previa).

## Reglas UI objetivo
- Un producto con `stock` por debajo del umbral de stock bajo se resalta visualmente en la lista.
- El formulario de creación/edición valida con el schema `src/features/products/schemas/product.schema.ts` (Yup) antes de permitir el submit.

## Política de estado
- `useProducts()` (TanStack Query) trae la lista desde la tabla `products` de Supabase.
- `useCreateProduct()` / `useUpdateProduct()` / `useDeleteProduct()` invalidan la query de lista al completarse.
- El formulario (Formik) mantiene su propio estado local mientras el usuario edita; no toca la cache de query hasta el submit exitoso.

## Datos requeridos
- Lista de productos: `useProducts()` → tabla `products`.
- Imagen de producto: URL pública de Supabase Storage (bucket `product-images`).

## Errores y recuperación
- Falla la carga de la lista: mostrar error con botón de reintentar (`refetch`).
- Falla el submit del formulario (constraint o RLS): mostrar error inline en el formulario, no perder los datos ingresados.
- Sesión expirada: redirección a `/login`.

## Navegación
- `/productos` -> formulario embebido (modal o panel) para crear/editar, sin cambiar de ruta.

## Diferencias entre desktop y mobile
- `No aplica.` (layout responsivo estándar, sin comportamiento distinto).

## Brechas detectadas en la implementación actual
- `No definido aún en esta versión.` (feature aún no implementada).

## Criterios de aceptación
- Un producto creado aparece en la lista sin recargar la página.
- Un producto editado refleja sus nuevos valores en la lista inmediatamente.
- Un producto con stock por debajo del umbral se distingue visualmente del resto.

## Preguntas abiertas
- ¿Eliminar un producto pide confirmación modal?
- ¿Se puede eliminar un producto que ya está referenciado en una actividad (`activity_products`), o debe bloquearse?
- ¿Cuál es el umbral exacto de "stock bajo" (constante a definir en `AGENTS.md`)?
