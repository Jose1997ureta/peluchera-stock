# AGENTS.md — Peluchera Stock

Guía de referencia para cualquier agente (Claude, Cursor, Copilot, etc.) que trabaje en este repositorio. Léela completa antes de generar código.

## 1. Qué es este proyecto

Sistema web de inventario para un negocio de venta de **juguetes y peluches**. Permite:

1. Administrar el catálogo de productos (CRUD).
2. Crear **actividades** (ferias, bazares, eventos de venta) y asignarles productos con una cantidad inicial reservada.
3. Durante una actividad **abierta**, registrar cuánto se vendió realmente de cada producto asignado.
4. **Cerrar** la actividad: descuenta del stock del producto solo lo realmente vendido (no lo reservado) y calcula un resumen (monto estimado vs. monto real vendido).
5. Ver un **dashboard** con métricas: ventas del mes, actividad más rentable, productos con stock bajo, etc.
6. Un módulo de **perfil** de usuario.

Uso **multi-usuario sin roles**: varias personas pueden tener cuenta y entrar al sistema (ej. el dueño y sus vendedores), pero todas tienen exactamente el mismo nivel de acceso — no hay admin/vendedor/invitado ni permisos diferenciados. Todos los usuarios autenticados comparten **un único inventario**: los mismos productos y las mismas actividades, como si administraran juntos la misma tienda. Se usa Supabase Auth (email/password) para el login; las políticas de RLS permiten a cualquier usuario autenticado leer y escribir sobre las mismas filas (no hay una columna `user_id` que aísle datos por dueño).

## 2. Stack tecnológico (decisiones fijas, no cambiar sin pedirlo el usuario)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | React 19 + TypeScript | Vite como bundler, `strict: true` en tsconfig |
| Estilos / UI | Tailwind CSS 4 + [beUI](https://beui.dev/) | beUI se instala componente por componente. **Siempre usar primero el MCP de beUI** (`list_components`, `search_components`, `get_component`, `get_install_command`) para descubrir e instalar componentes; si el MCP no está disponible en la sesión, usar como respaldo el CLI de shadcn (`npx shadcn add <componente>` / `npx shadcn add @beui/<componente>`). El código instalado vive en `src/shared/components/ui/` y es 100% editable, no es una dependencia de node_modules a ciegas |
| Animaciones | Motion (Framer Motion) | Viene con los componentes de beUI que la usan |
| Backend / DB | Supabase (Postgres + Auth + Storage) | Storage para las imágenes de producto. RLS activado sobre todas las tablas |
| Formularios | Formik | Un `useFormik`/`<Formik>` por formulario, sin lógica de negocio dentro del JSX |
| Validación | Yup | Un schema por entidad, dentro de `features/<feature>/schemas/` |
| Server state | TanStack Query | Todas las llamadas a Supabase pasan por hooks `useQuery`/`useMutation`, nunca `useEffect` + `fetch` manual |
| Routing | React Router | Rutas declaradas en `src/app/routes.tsx` |
| Gestor de paquetes | npm | Usar `npm install`/`npm run …` en toda la documentación y scripts |

No introducir Redux, MobX, Next.js, ni otra librería de UI (MUI, Chakra, Ant) — el estándar visual del proyecto es Tailwind + beUI.

## 3. Modelo de dominio

### Entidades

**`products`**
- `id`, `name`, `price` (numeric), `stock` (int), `image_url`, `is_active` (boolean, default `true`), `created_at`, `updated_at`.
- No tiene campo `description` — se sacó a pedido del usuario, no reintroducirlo sin que lo pida explícitamente.
- `is_active = false` es un producto **desactivado**: no aparece en el listado principal ni en las métricas de stock bajo del dashboard, pero sigue existiendo (no es un borrado). Se puede reactivar en cualquier momento. Ver `spec/products/products-feature.md`.

**`zonas`**
- `id`, `name`, `created_at`. Semilla inicial: `1 = Tienda`, `2 = Colegio` — se puede ampliar agregando filas (sin UI de administración todavía, se hace directo en Supabase). Sin `is_active` ni borrado lógico por ahora.

**`activities`**
- `id`, `name`, `zona_id` (integer, `references zonas(id)`), `status` (`'open' | 'closed'`, default `'open'`), `revenue` (numeric, ingresos reales ingresados a mano al cerrar la actividad — `null` mientras está `open`), `cut_id` (id del corte de Caja Chica que archivó la actividad, `null` mientras no pertenece a ninguno), `created_at`, `closed_at`.
- No tiene campo `description` — se sacó a pedido del usuario, no reintroducirlo sin que lo pida explícitamente.
- No hay más estados (no "programada", no "cancelada") — mantenerlo así salvo que el usuario lo pida explícitamente.

**`activity_products`** (línea del "carrito" de una actividad)
- `id`, `activity_id`, `product_id`, `unit_price` (snapshot del precio del producto al momento de agregarlo, para que cambios de precio futuros no distorsionen el historial), `initial_qty` (cantidad reservada/sacada para la actividad), `sold_qty` (cantidad realmente vendida, editable mientras la actividad esté abierta, default `0`).
- No hay ningún campo de costo/margen por producto ni por línea — el negocio no vende con margen unitario (es una máquina de peluches/grúa). No reintroducir `cost`/`unit_cost` sin que el usuario lo pida explícitamente.

**`cash_cuts`** (registro histórico e inmutable de un corte de Caja Chica)
- `id`, `closed_at`, `total_revenue` (numeric — ver "Ganancia de una actividad" abajo, **no** es el `revenue` ingresado a mano), `total_profit` (numeric), `activities_count` (int), `activity_ids` (uuid[]).

### Reglas de negocio clave

- Al **agregar** un producto a una actividad: se copia el precio actual (`unit_price`) — responsabilidad del backend (RPC), no del cliente — y se resta `initial_qty` del stock disponible para "reservarlo" — o bien se valida contra el stock disponible sin descontarlo aún (decidir un único enfoque y documentarlo en el código; **no** descontar dos veces).
- Mientras la actividad está **abierta**: se puede editar `sold_qty` de cada línea (0 ≤ `sold_qty` ≤ `initial_qty`).
- Al **cerrar** una actividad (acción irreversible):
  1. Por cada línea, descontar del `stock` del producto exactamente `sold_qty` (lo vendido, **no** `initial_qty`).
  2. Si el enfoque de reserva restaba `initial_qty` al agregar el producto, devolver la diferencia (`initial_qty - sold_qty`) al stock.
  3. Cambiar `status` a `'closed'` y setear `closed_at = now()`.
  4. Esta operación debe ser **atómica** (usar una función/RPC de Postgres en Supabase, no varias llamadas sueltas desde el cliente).
- Resumen de una actividad = suma de (`unit_price * initial_qty`) como "monto estimado" y suma de (`unit_price * sold_qty`) como "monto real vendido" (a precio de catálogo — llamado **"subtotal real"** en el resumen de una actividad puntual y **"monto de la inversión"** una vez cerrada, ver `spec/activities/activities-feature.md`).
- **Ganancia de una actividad** = `revenue` (ingreso real, ingresado a mano al cerrarla) **menos** el subtotal real (`Σ unit_price * sold_qty`) — no es directamente el ingreso: en una máquina de peluches/grúa, el ingreso incluye lo cobrado por todas las jugadas (haya "salido" premio o no), así que se resta el valor de catálogo de lo efectivamente entregado para llegar a la ganancia neta.
- Listado de actividades: filtro por estado (con `'open'` como filtro por defecto al entrar al módulo) y por zona.
- **Caja Chica**: acumula, para todas las actividades `closed` con `cut_id is null`, la suma de subtotales reales (columna `total_revenue` de `cash_cuts` — nombre heredado, no es el ingreso manual) y la suma de ganancias (`total_profit`) de cada una. "Iniciar corte" archiva ese acumulado como una fila nueva de `cash_cuts` y marca esas actividades con el `cut_id` resultante (atómico, función `create_cash_cut`), para que el acumulado "actual" vuelva a $0.

### Métricas de dashboard

- Ventas del mes: suma de montos reales vendidos de actividades cerradas en el mes en curso.
- Actividad más rentable: mayor monto real vendido (no hay campo de costo/margen, ver sección 3 — no inventarlo).
- Productos con stock bajo: por debajo de un umbral configurable (definir constante, ej. `LOW_STOCK_THRESHOLD = 5`, no hardcodear el número repetido en varios archivos).

## 4. Estructura de carpetas

```
src/
  app/            # App shell, providers (QueryClient, Router), layout, routes.tsx
  features/
    products/
      components/  # Componentes propios de la feature (ProductForm, ProductCard, ...)
      hooks/       # Hooks de TanStack Query (useProducts, useCreateProduct, ...) + api.ts
      schemas/     # Yup schema de la entidad (product.schema.ts)
    activities/
      components/
      hooks/
      schemas/
    activity-session/ # Vista de "gestionar actividad abierta": editar vendidos, cerrar
      components/
      hooks/
    dashboard/     # Métricas
      components/
      hooks/
    profile/       # Perfil de usuario
      components/
      hooks/
      schemas/
  shared/          # Todo lo que se comparte entre 2+ features
    components/ui/ # Componentes de beUI (instalados vía su MCP, o vía CLI de shadcn como respaldo) — no reescribir a mano su lógica interna
    hooks/         # Hooks genéricos reutilizables (ej. useDebounce, useMediaQuery)
    types/         # Tipos TS generados/derivados de Supabase (usar `supabase gen types typescript`) e interfaces compartidas
    utils/         # Funciones utilitarias puras (formateo de moneda, fechas, etc.)
    lib/
      supabase.ts    # Cliente único de Supabase
      queryClient.ts
    core/          # Constantes/variables usadas en todo el proyecto (ej. LOW_STOCK_THRESHOLD, nombres de bucket de Storage, paths de rutas)
    data/          # JSON de datos mock/fixture para prototipar UI antes de conectar Supabase — nunca fuente de verdad de negocio ni de autenticación
```

Cada feature es autocontenida: sus propios `components/`, `hooks/` (incluye las llamadas a Supabase vía TanStack Query) y `schemas/` si tiene formularios. Nada dentro de `features/<feature>/` se importa desde otra feature — si dos features necesitan lo mismo, se promueve a `shared/`.

## 5. Convenciones de código

- TypeScript estricto, sin `any` salvo justificación explícita en comentario.
- Componentes funcionales, named exports (excepto páginas de rutas, que pueden usar default export por convención de React Router lazy loading).
- Un archivo = una responsabilidad. Los hooks de datos (`useProducts`, `useCreateActivity`, etc.) viven separados del componente que los consume.
- Las llamadas a Supabase se centralizan en `features/<feature>/hooks/` (un `api.ts` con las funciones de Supabase + los hooks de TanStack Query que las envuelven); los componentes solo consumen esos hooks, nunca el cliente de Supabase directamente.
- Formik + Yup: el schema de validación es la única fuente de verdad de las reglas del formulario (mensajes de error, límites), no duplicar validaciones a mano en el componente.
- Evitar prop drilling: si un estado se necesita en más de 2 niveles, usar contexto de la feature o TanStack Query cache, no una librería nueva de estado global.
- No crear abstracciones genéricas ("factory de CRUD", "hook genérico para cualquier tabla") de entrada — replicar el patrón concreto en cada feature hasta que haya 3+ casos reales idénticos.
- Nombrar en español los datos de negocio visibles al usuario (labels, mensajes) y en inglés el código (variables, funciones, tipos).

## 6. Seguridad y datos

- RLS habilitado en todas las tablas de Supabase; la policy exige `auth.role() = 'authenticated'` (cualquier usuario logueado), no `auth.uid() = user_id` — el inventario es compartido entre todos los usuarios, no hay filas privadas por dueño.
- Nunca exponer la `service_role key` en el cliente — solo la `anon key` pública, protegida por RLS.
- Las imágenes de producto van a Supabase Storage, no como base64 en la base de datos.
- Ninguna contraseña ni credencial real debe vivir en archivos del repositorio (JSON, `.ts`, etc.) — las contraseñas de usuarios reales solo existen hasheadas dentro de Supabase Auth. Cualquier archivo de datos de ejemplo con `password` (ej. `shared/data/`) es mock/fixture explícito para prototipar UI, nunca la fuente de verdad de autenticación.

## 7. Estado de este documento

Este archivo se actualiza a medida que el proyecto avanza. Si una decisión aquí queda obsoleta por un cambio pedido por el usuario, actualizar esta sección en el mismo cambio.
