# {Feature Name}

## Versión
v0-objective-draft

## Objetivo
{Qué debe lograr la feature}

## Alcance objetivo
- {comportamiento, regla o resultado especificado}

## Reglas objetivo
- {regla funcional o de negocio confirmada}

## Vistas afectadas
- {desktop / mobile / ambas — solo si hay diferencias reales de layout o interacción}

## Política de estado
- {hook de datos responsable, ej. `useProducts`, `useCloseActivity`}: {vive en cache de TanStack Query / estado local del componente / estado de formulario Formik}
- {dónde vive el dato mientras el usuario interactúa: en el formulario, en estado local de la página, o ya persistido en Supabase}
- {estado temporal (ej. carrito de una actividad abierta) o persistente}

## Contratos de datos
- Schema de validación: `src/features/{feature}/schemas/{entidad}.schema.ts` (Yup) — {campos y reglas relevantes}
- Tabla/vista de Supabase: `{tabla}` — {columnas relevantes}
- Payload de mutación: {campos que efectivamente se envían a Supabase}

## Persistencia
- {dato}: {tabla de Supabase `<nombre>` / Supabase Storage `<bucket>` / localStorage `<key>` / solo en memoria / no aplica}

## Errores esperados y recuperación
- {error}: {recuperación esperada}
- Sesión expirada (Supabase Auth): {redirección a login}
- Sin conexión / error de red: {comportamiento esperado}
- Violación de RLS o constraint de Postgres: {comportamiento esperado}

## Navegación relevante
- {origen} -> {destino}: {condición}
- Ruta registrada: {path en `src/app/routes.tsx` / embebida en otra página / no navegable}

## Profundidad en Supabase
- Requiere: {mutación simple desde el cliente / función-RPC atómica en Postgres}
- Por qué es suficiente: {justificación, ej. "el cierre de actividad toca varias filas y debe ser atómico"}
- Políticas de RLS relevantes: {lista o `No definido aún en esta versión.`}

## Brechas detectadas en la implementación actual
- {diferencia entre objetivo e implementación actual}

## Criterios de aceptación
- {criterio verificable}

## Preguntas abiertas
- {decisión pendiente real}

## Notas de uso
- No incluir secciones genéricas de fuera de alcance.
- No listar cosas no especificadas por el usuario.
- Si algo visible existe pero no tiene acción, documentarlo como sin comportamiento funcional en v0.
- No documentar valores literales de texto o color: documentar la referencia (constante, schema, columna) que los provee.
- No inventar roles ni multiusuario: el sistema es single-user.
