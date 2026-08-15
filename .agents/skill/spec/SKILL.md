---
name: create-spec
description: Crear, actualizar o validar specs desde cero o a partir del análisis de features existentes en src/features, src/shared/lib y src/shared/components/ui del proyecto Peluchera Stock.
---

# Skill: Create Spec

## Objetivo

Este skill ayuda a crear documentación de especificación de forma guiada para el proyecto web `Peluchera Stock` (React + TypeScript + Supabase + Formik/Yup + beUI).

Soporta cuatro modos:

1. `create`
    - crea specs desde cero
    - hace preguntas por secciones
    - propone opciones cuando falta información
    - usa placeholders controlados si algo queda pendiente

2. `analyze-existing-feature`
    - analiza un feature ya implementado
    - revisa `src/features/<feature>`, `src/shared/lib`, `src/features/<feature>/schemas`, `src/shared/types`, `src/app/routes.tsx`, `src/shared/components/ui`
    - propone una spec objetivo inicial basada en la intención detectada y decisiones del usuario
    - usa el código actual solo para detectar brechas, riesgos y preguntas
    - separa hallazgos de análisis en:
        - confirmado por implementación
        - inferido, requiere validación
        - no definido aún
    - luego pregunta al usuario para cerrar vacíos

3. `validate-change`
    - valida una solicitud nueva contra specs existentes
    - detecta conflictos, impactos y decisiones abiertas
    - recomienda si la spec debe actualizarse antes o después de implementar
    - no implementa cambios por sí mismo

4. `finalize-iteration`
    - compara cambios finales contra una spec
    - clasifica diferencias relevantes
    - recomienda qué actualizar en la spec
    - evita tocar la spec por microcambios no estables

---

## Cuándo usar este skill

Usar este skill cuando el usuario quiera:

- crear una spec desde cero
- documentar una página/vista antes de implementarla
- documentar una feature ya existente
- generar una spec inicial a partir de código ya construido
- detectar inconsistencias de comportamiento entre vistas o breakpoints (desktop/mobile)
- formalizar comportamiento actual antes de refactorizar o mejorar
- validar una solicitud nueva contra una spec existente
- decidir si un cambio debe actualizar la spec antes de implementar
- cerrar una iteración revisando diferencias entre spec y resultado final

---

## Modos soportados

### 1. create
Crear specs desde cero.

### 2. analyze-existing-feature
Generar specs a partir de una implementación existente.

### 3. validate-change
Validar una solicitud nueva contra una spec existente antes de implementar.

### 4. finalize-iteration
Revisar cambios finales contra una spec y proponer actualizaciones.

---

## Regla principal

`AGENTS.md` es la autoridad superior del repositorio.

Una spec no puede contradecir:

- la arquitectura React definida en `AGENTS.md`: features autocontenidas en `src/features/<feature>` (componentes + hooks de datos + schema de validación propios)
- la separación entre `src/app` (shell/routing/providers), `src/features` (CRUD y flujos de negocio), `src/shared/components/ui` (componentes de beUI), `src/shared/lib` (cliente de Supabase, utilidades), `src/shared/hooks` (hooks compartidos), `src/features/<feature>/schemas` (Yup) y `src/shared/types` (tipos generados de Supabase)
- las reglas críticas de negocio: modelo `products` / `activities` / `activity_products`, estados de actividad (`open` / `closed` únicamente), descuento de stock por `sold_qty` (lo realmente vendido) y no por `initial_qty` (lo reservado), y que el cierre de actividad es una operación atómica vía función/RPC de Supabase
- el stack oficial (React 19, TypeScript, Vite, Tailwind CSS 4, beUI, Supabase, Formik, Yup, TanStack Query, React Router)
- las restricciones de dependencias (no agregar paquetes ni librerías de UI/estado alternativas sin autorización — ver sección 6 de `docs/LIBRARIES.md` y sección 2 de `AGENTS.md`)
- el carácter single-user del sistema (no inventar roles, permisos ni multiusuario)
- las reglas de seguridad de datos (RLS en todas las tablas de Supabase, `anon key` únicamente en el cliente, imágenes en Supabase Storage y no en base64)

Una spec tampoco debe empujar sobrearquitectura por defecto.

Si el cambio vive en `src/shared/lib` (cliente de Supabase, RPCs) o cruza varias features, la spec debe dejar claro si requiere:

- un hook de datos nuevo en `src/features/<feature>/hooks/api.ts` (caso simple, una tabla)
- una función/RPC de Postgres en Supabase (caso que necesita atomicidad, ej. cerrar actividad)
- un hook compartido en `src/shared/hooks/` (caso que cruza más de una feature)

La spec no debe asumir que toda feature necesita generar hooks genéricos reutilizables ("factory de CRUD") si el caso no lo justifica. Según `AGENTS.md`, replicar el patrón concreto hasta tener 3+ casos reales idénticos es aceptable.

Nunca presentar como verdad absoluta algo que fue inferido desde código.

Toda salida del modo `analyze-existing-feature` debe clasificar el contenido en:

- `Confirmado por implementación`
- `Inferido, requiere validación`
- `No definido aún`

La spec final de `analyze-existing-feature` debe ser objetiva por defecto: debe describir cómo debe funcionar el feature, no solo una foto pasiva del código actual. Las diferencias del código actual deben ir en `Brechas detectadas`, no como reglas objetivo.

Toda salida del modo `validate-change` debe clasificar el cambio en:

- `Sin conflicto detectado`
- `Conflicto con spec`
- `Decisión pendiente`
- `Impacto técnico`
- `Recomendación`

---

## Paths por defecto

Las specs viven en la carpeta `spec/` en la raíz del proyecto.

### Feature Spec
`spec/<feature>/<feature-name>.md`

### Page Spec
`spec/<feature>/<page-name>.md`

### UI Contract
`spec/<feature>/<feature>-ui-contract.md`

Crear UI Contract solo si aporta valor propio: varios estados compartidos entre páginas, payloads/eventos delicados, más de una página consumiendo el mismo hook de datos o el mismo estado de formulario, componentes complejos de `src/shared/components/ui`, o riesgo real de divergencia entre vistas desktop/mobile.

### Flow Spec
`spec/<feature>/<flow-name>.md`

Crear flow spec solo si el usuario lo pide o si el flujo tiene valor propio: varios pasos, más de una página, navegación relevante, estado propio del flujo (por ejemplo el "carrito" de productos de una actividad mientras está abierta) o reglas de negocio transversales.

### Spec Change Review
`spec/<feature>/<change-name>-spec-review.md`

---

## Cuándo usar spec antes de implementar

Usar este skill antes de implementar cuando:

- el usuario pida validar o actualizar una spec
- se cree una nueva feature, página importante o flujo
- el cambio afecte reglas de negocio del modelo `products` / `activities` / `activity_products` (precio, stock, `initial_qty`, `sold_qty`, montos estimado/real)
- el cambio afecte el ciclo de vida de una actividad (`open` → `closed`) o la operación de cierre
- el cambio afecte navegación principal (`src/app/routes.tsx`, layout, guard de autenticación)
- el cambio afecte dónde vive el estado de una feature (cache de TanStack Query vs. estado local de componente vs. contexto de feature)
- el cambio afecte `src/shared/lib/supabase.ts`, RPCs de Postgres, políticas de RLS, Supabase Storage o Supabase Auth
- el cambio afecte contratos de datos (schemas de Yup, tipos generados de Supabase, payloads de mutaciones)
- el cambio afecte las métricas del dashboard (definición de "ventas del mes", "actividad más rentable", umbral de stock bajo)
- el cambio pueda contradecir una spec existente
- se quiera documentar comportamiento existente antes de refactorizar

Ejemplos:

- cerrar una actividad: validar cantidades vendidas, descontar stock real, calcular resumen de montos
- cambiar el criterio de "actividad más rentable" en el dashboard
- cambiar el umbral de "stock bajo"
- agregar edición de `sold_qty` línea por línea antes de cerrar una actividad
- decidir si una nueva vista necesita su propio hook de datos o puede reusar uno existente de la misma feature

---

## Cuándo no tocar spec inmediatamente

No actualizar la spec por cada microcambio durante iteración.

Implementar directamente y dejar la spec para cierre cuando el cambio sea:

- padding, spacing, color o copy exploratorio
- ajuste visual menor en un componente de `src/shared/components/ui`
- rename interno sin cambio de contrato
- bug localizado sin impacto funcional o técnico mayor
- fix de compilación/tipos obvio
- ajuste de texto en español que no cambia una regla de negocio

Al cierre, si el cambio se volvió estable, recomendar actualizar la spec.

---

## Modo compacto y ahorro de tokens

Por defecto, este skill debe trabajar en modo compacto.

No hacer validaciones extensas contra spec, comparaciones largas ni actualizaciones de spec cuando:

- el usuario no lo pidió explícitamente
- el cambio es visual menor, copy, padding o spacing exploratorio
- el cambio no afecta contratos, estado, navegación, negocio (stock/montos/estados de actividad), Supabase (tablas/RPC/RLS/Storage/Auth) o esquemas de validación

Cuando el usuario pida explícitamente validar, comparar o actualizar spec, aplicar el modo correspondiente.

Si el cambio parece pequeño pero afecta `src/shared/lib/supabase.ts`, RPCs, RLS, contratos de datos, stock, montos, cierre de actividad o Supabase Auth, advertir el impacto y recomendar validación contra spec antes de implementar.

Las salidas deben ser breves por defecto:

- specs revisadas si aplica
- conflicto o ausencia de conflicto
- decisión pendiente si bloquea
- recomendación concreta

No incluir resúmenes largos ni texto completo de spec salvo que el usuario lo pida.

---

## Nivel de detalle esperado

Una spec debe ser suficiente para validar decisiones importantes, no cada detalle visual.

Debe documentar, según aplique:

- objetivo
- alcance
- reglas de negocio
- política de estado (qué vive en cache de TanStack Query, qué vive en estado local del componente, qué vive en Supabase)
- contratos de datos (schema de Yup, tipo de Supabase, payload de mutación)
- navegación relevante
- errores esperados y recuperación
- persistencia (tabla de Supabase / Supabase Storage / localStorage / solo en memoria)
- diferencias de layout entre desktop y mobile, si son relevantes
- criterios de aceptación
- dudas abiertas

Cuando la spec toque Supabase (tablas, RPCs o RLS), debe documentar además:

- si el caso requiere una función/RPC atómica en Postgres o basta con una mutación simple desde el cliente
- por qué esa profundidad es suficiente
- qué políticas de RLS aplican
- qué no se creará intencionalmente (ej. no se crea un rol nuevo, no se agrega una tabla de auditoría)

No debe documentar por defecto:

- una sección genérica de `Fuera de alcance`
- cosas no especificadas por el usuario
- cosas que no aparecen como elemento visible, contrato requerido o regla necesaria
- responsabilidades de otras features o flujos solo para aclarar que no se implementan

Si un elemento visible está especificado pero no tiene comportamiento funcional aún, documentarlo como alcance limitado. Ejemplo: `Mostrar botón "Exportar" sin comportamiento funcional en v0`.

Usar `Fuera de alcance` solo cuando el usuario lo pida o cuando sea necesario evitar una confusión probable sobre algo visible o directamente relacionado.

No necesita documentar:

- padding exploratorio
- colores temporales
- copy no definitivo
- nombres internos de variables, hooks o componentes salvo que afecten el contrato
- estructura exacta de JSX salvo que afecte arquitectura

---

## Flujo general del modo create

### Paso 1
Preguntar qué tipo de spec quiere crear:
- feature
- page
- ui contract solo si hay contrato complejo
- flow solo si hay flujo con valor propio

### Paso 2
Preguntar nombre y contexto:
- nombre de la feature o página
- alcance:
    - solo presentación (componente + JSX)
    - presentación + estado (estado local o de formulario)
    - presentación + estado + datos (hook de TanStack Query contra Supabase)
    - transversal (`src/shared/lib`, `src/shared/components/ui`, `src/shared/hooks`)
- vistas afectadas: desktop / mobile / ambas (si hay diferencias reales de layout o interacción)

### Paso 3
Preguntar por secciones mínimas.

Secciones mínimas recomendadas:

- objetivo
- alcance
- reglas de negocio
- política de estado
- contratos de datos
- errores esperados
- diferencias desktop/mobile si aplica
- criterios de aceptación
- dudas abiertas

### Paso 4
Si el usuario responde:
- no sé
- dame opciones
- qué recomiendas

entonces:
- proponer 2 a 4 alternativas
- explicar cuándo conviene cada una
- recomendar una
- pedir validación

### Paso 5
Generar el archivo final usando:
- contenido confirmado
- supuestos aceptados por el usuario
- placeholders si algo quedó pendiente

---

## Flujo general del modo analyze-existing-feature

### Paso 1. Identificar feature
Preguntar:
- ¿qué feature quieres analizar?
- ¿cuál es el nombre de la carpeta o feature?

### Paso 2. Identificar rutas
Preguntar o inferir rutas probables en:
- `src/features/<feature>/`
- `src/shared/lib/supabase.ts` y cualquier RPC relacionada
- `src/app/routes.tsx`
- `src/features/<feature>/schemas/<entidad>.schema.ts`
- `src/shared/types/database.ts`

Si el usuario no las da, proponer rutas probables.

### Paso 3. Analizar estructura
Revisar, según exista:

#### Feature
- `components/` (componentes propios de la feature, ej. `ProductForm`, `ActivityCard`)
- `api.ts` (llamadas a Supabase: `select`, `insert`, `update`, `delete`, RPCs)
- hooks de TanStack Query (`useProducts`, `useCreateActivity`, `useCloseActivity`, etc.)
- `schema.ts` o referencia a `src/features/<feature>/schemas/<entidad>.schema.ts` (Yup)
- páginas registradas en `src/app/routes.tsx`

#### Capa de datos compartida
- `src/shared/lib/supabase.ts` (cliente único)
- funciones/RPC de Postgres (ej. función de cierre de actividad)
- políticas de RLS relevantes
- Supabase Storage (bucket de imágenes de producto)

#### Transversal
- `src/shared/components/ui/` (componentes de beUI consumidos)
- `src/shared/hooks/` (hooks compartidos entre features)
- `src/shared/lib/queryClient.ts` (configuración de TanStack Query)

### Paso 4. Extraer hallazgos
Construir una propuesta con:

#### Confirmado por implementación
Solo lo visible claramente en el código.

#### Inferido, requiere validación
Lo que parece ser el comportamiento pero no está garantizado.

#### No definido aún
Lo que no se pudo determinar desde código.

### Paso 5. Convertir a spec objetivo
Construir la spec final con:
- comportamiento objetivo confirmado por el usuario
- decisiones explícitas tomadas durante el análisis
- brechas detectadas en la implementación actual
- preguntas abiertas solo cuando falten decisiones reales

No convertir deuda o inconsistencias actuales en reglas objetivo.

### Paso 6. Proponer archivos
Proponer solo archivos que aporten valor:
- feature spec
- page spec
- ui contract solo si hay contrato complejo o riesgo real de divergencia
- flow spec solo si aplica

### Paso 7. Hacer preguntas abiertas
Preguntar al usuario por vacíos funcionales o de intención de negocio.

### Paso 8. Generar borrador inicial
Usar sufijo de versión:
- `v0-objective-draft`

Si el usuario pide explícitamente una foto del código actual, usar `v0-generated-from-code`.

---

## Flujo general del modo validate-change

### Paso 1. Identificar solicitud nueva
Leer el cambio pedido por el usuario y detectar si afecta:

- UI simple
- UX
- navegación (`src/app/routes.tsx`, layout)
- estado (cache de TanStack Query, estado local, estado de formulario Formik)
- lógica de negocio (precio, stock, `initial_qty`/`sold_qty`, montos, estados de actividad, umbral de stock bajo, métricas de dashboard)
- contratos de datos (schema de Yup, tipos de Supabase, payload de mutación)
- persistencia (tabla de Supabase, Supabase Storage, localStorage)
- Supabase (RPCs, RLS, Auth, Storage)
- errores (manejo de `PostgrestError`, sesión expirada)

### Paso 2. Identificar specs relevantes
Buscar o pedir las specs relacionadas.

Rutas probables:

- `spec/<feature>/`
- specs generadas desde código

### Paso 3. Comparar solicitud contra spec
Clasificar:

#### Sin conflicto detectado
- {punto compatible}

#### Conflicto con spec
- {punto conflictivo}

#### Decisión pendiente
- {pregunta o decisión necesaria}

#### Impacto técnico
- {features / lib / schemas / types / rutas / Supabase (tablas, RPC, RLS, Storage, Auth) / tests}

#### Recomendación
- {actualizar spec antes, implementar directo, o implementar y actualizar spec al cierre}

### Paso 4. Preguntar solo si bloquea
Preguntar al usuario únicamente cuando:

- el cambio contradice una regla de negocio (ej. de dónde se descuenta el stock)
- el contrato de datos queda ambiguo
- la política de estado no está clara (dónde vive el dato: cache de query, estado local, o Supabase)
- hay riesgo de romper navegación, RLS o el cierre atómico de una actividad
- hay más de una opción válida con trade-off relevante

### Paso 5. Actualizar spec si corresponde
Actualizar spec antes de implementar solo cuando:

- el usuario lo pidió
- el cambio afecta contrato funcional o técnico estable
- el cambio afecta negocio, estado, persistencia, Supabase o contratos de datos compartidos

---

## Flujo general del modo finalize-iteration

### Paso 1. Revisar cambios realizados
Comparar el resultado final contra la spec base.

### Paso 2. Clasificar diferencias
Usar estas categorías:

- cambio visual simple
- cambio de UX
- cambio de navegación
- cambio de estado
- cambio de lógica de negocio
- cambio de persistencia
- cambio en Supabase (tabla, RPC, RLS, Storage, Auth)
- cambio de contrato público o compartido

### Paso 3. Recomendar actualización de spec
Recomendar actualizar la spec cuando:

- la diferencia ya representa una decisión estable
- afecta negocio, estado, navegación, persistencia, Supabase o contratos
- podría confundir futuras implementaciones

No recomendar actualización obligatoria si:

- fue un microajuste visual exploratorio
- fue copy temporal
- no afecta comportamiento ni contrato

### Paso 4. Proponer texto concreto
Cuando se recomiende actualizar, proponer el texto exacto o editar la spec si el usuario lo autoriza.

---

## Salida esperada del modo analyze-existing-feature

Siempre devolver:

1. Resumen del feature detectado
2. Archivos spec sugeridos
3. Borradores iniciales
4. Lista de vacíos
5. Preguntas para validar

---

## Salida esperada del modo validate-change

Siempre devolver:

1. Specs revisadas
2. Compatibilidad con la spec
3. Conflictos detectados
4. Decisiones pendientes
5. Impacto técnico por capa
6. Recomendación antes de implementar

---

## Salida esperada del modo finalize-iteration

Siempre devolver:

1. Diferencias contra la spec
2. Clasificación de cada diferencia
3. Impacto estimado
4. Recomendación de actualización
5. Archivos spec que deberían cambiar si el usuario confirma

---

## Formato obligatorio de clasificación

Usar exactamente estas secciones cuando el modo sea `analyze-existing-feature`:

### Confirmado por implementación
- {hallazgo}

### Inferido, requiere validación
- {hallazgo inferido}

### No definido aún
- {vacío}

Usar exactamente estas secciones cuando el modo sea `validate-change`:

### Specs revisadas
- {spec}

### Sin conflicto detectado
- {punto compatible}

### Conflicto con spec
- {conflicto}
- Si no aplica: `No definido aún en esta versión.`

### Decisión pendiente
- {decisión}
- Si no aplica: `No definido aún en esta versión.`

### Impacto técnico
- {impacto}

### Recomendación
- {recomendación}

Usar exactamente estas secciones cuando el modo sea `finalize-iteration`:

### Diferencias contra la spec
- {diferencia}

### Clasificación
- {categoría}

### Impacto
- {impacto}

### Recomendación de actualización
- {recomendación}

---

## Placeholders estándar permitidos

- `No definido aún en esta versión.`
- `Pendiente por definir.`
- `Se definirá en una iteración posterior.`

---

## Reglas de análisis

### Regla 1
No asumir intención de negocio solo porque existe un componente, un hook o una ruta.

### Regla 2
Si el comportamiento difiere entre desktop y mobile, marcarlo como inconsistencia y no como regla objetivo, salvo que sea una diferencia de layout intencional ya confirmada.

### Regla 3
Si una regla de negocio (cálculo de stock, montos, estado de actividad) vive dentro de un componente JSX y no en un hook de `api.ts` o una función/RPC de Supabase, marcar posible lógica fuera de lugar.

### Regla 4
Si una parte del flujo no se puede deducir, dejarla como no definida.

### Regla 5
Si hay nombres ambiguos, preguntar antes de cerrar la spec final.

### Regla 6
No bloquear microcambios visuales por falta de actualización de spec.

### Regla 7
Si un cambio modifica contratos de `src/shared/lib/supabase.ts`, un schema de Yup o una función/RPC de Postgres, validarlo contra spec aunque parezca pequeño.

### Regla 8
Si el usuario pide validar contra spec, hacerlo antes de implementar.

### Regla 9
Si el usuario pide iterar rápido, implementar microajustes sin tocar spec y sugerir actualización al cierre.

### Regla 10
Si no está especificado por el usuario, no aparece como elemento visible y no es necesario para un contrato o regla del feature, no incluirlo.

### Regla 11
Si un elemento visible está especificado pero aún no tiene acción, incluir solo su presencia visual y aclarar que no ejecuta flujo funcional en esta versión.

### Regla 12
Evitar `Fuera de alcance` como sección por defecto. Usarla únicamente para desambiguar algo que el usuario mencionó, algo visible en la UI, o algo que pueda confundirse razonablemente con el alcance del cambio.

### Regla 13
Código comentado no es comportamiento vigente. Si una ruta, un componente o una llamada está comentada, documentarlo como brecha o deuda, nunca como regla objetivo.

### Regla 14
No documentar textos, colores o valores literales como reglas de la spec cuando exista una constante o schema que los defina; documentar la referencia (nombre de constante, nombre de schema de Yup, nombre de columna de Supabase), no el valor hardcodeado.

### Regla 15
Este proyecto es single-user: no inventar roles, permisos ni diferenciación de usuarios. Si el usuario pide algo así, marcarlo como `Decisión pendiente` porque contradice `AGENTS.md`.

### Regla 16
El descuento de stock al cerrar una actividad se hace por `sold_qty` (lo realmente vendido), nunca por `initial_qty` (lo reservado). Cualquier spec o cambio que proponga lo contrario debe marcarse como `Conflicto con spec` / riesgo de negocio.

---

## Preguntas sugeridas al terminar el análisis

- ¿Este comportamiento es intencional o temporal?
- ¿El flujo actual aplica igual en desktop y en mobile?
- ¿La navegación detectada ya es definitiva?
- ¿Deseas que marque las diferencias de layout entre desktop y mobile como deuda técnica?
- ¿Esta spec debe mantener alguna brecha actual como comportamiento aceptado o debe corregirla como objetivo?

---

## Ejemplo de petición válida

`Analiza el feature activities ya implementado y genera una spec inicial. Clasifica los hallazgos en confirmado por implementación, inferido y no definido aún. Luego proponme preguntas para cerrar vacíos.`

`Quiero agregar edición de sold_qty por línea antes de cerrar una actividad. Valida contra la spec de Activities, dime si hay conflictos y qué habría que actualizar antes de implementar.`

`Ya terminé los ajustes visuales del dashboard. Compara los cambios contra la spec y dime si conviene actualizarla o si fueron cambios simples.`

---

## Restricciones

- No inventar reglas de negocio no confirmadas.
- No inventar nombres de columnas, tablas, RPCs o rutas.
- No convertir inferencias en hechos.
- No bloquear la creación de la spec por falta de información.
- No mezclar comportamiento actual con comportamiento deseado sin marcar la diferencia.
- No proponer dependencias nuevas dentro de una spec sin autorización del usuario.
- No inventar roles, multiusuario ni estados de actividad adicionales a `open`/`closed` sin confirmación explícita del usuario.
