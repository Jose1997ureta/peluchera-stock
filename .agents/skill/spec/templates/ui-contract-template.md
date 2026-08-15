# {Feature Name} UI Contract

## Versión
v0-objective-draft

## Objetivo
{Contrato mínimo entre la UI (páginas/componentes) y los hooks de datos (TanStack Query) o el formulario (Formik/Yup). No repetir reglas funcionales de la feature.}

## Cuándo crear este documento
- Usar solo si el contrato tiene valor propio: varios estados compartidos entre páginas, payloads/eventos delicados, más de una página consumiendo el mismo hook, componentes complejos de `src/shared/components/ui`, o riesgo real de divergencia entre vistas desktop/mobile.

## Hooks de datos
- Query: {`use<Entidad>` / `use<Entidad>List`} — {tabla o vista de Supabase que consulta}
- Mutación: {`useCreate<Entidad>` / `useUpdate<Entidad>` / `useClose<Entidad>`} — {tabla o RPC que afecta}

## Datos de entrada (payload / argumentos)
- {mutación o query}: {payload, requerido/opcional, restricciones}

## Datos de salida
- {forma del dato devuelto por la query}: {significado para la UI}
- {campo derivado calculado en el cliente, si existe}: {de dónde sale y por qué no vive en Supabase}

## Estado UI requerido
- {estado}: {qué debe renderizar la UI — ej. `isLoading`, `isError`, `isEmpty`, `data`}

## Errores por campo o página
- {error de validación Yup}: {mensaje}
- {error de Supabase/RLS}: {mensaje / recuperación}

## Contrato de Supabase
- Tabla/RPC: `{nombre}`
- Columnas leídas: {lista}
- Columnas escritas: {lista}
- Política de RLS aplicable: {nombre o condición}

## Reglas de seguridad del contrato
- {regla para no exponer datos sensibles: nunca usar la `service_role key` en el cliente, no exponer campos que no correspondan}

## Brechas detectadas en la implementación actual
- {diferencia entre contrato objetivo e implementación actual}

## Criterios de aceptación
- {criterio verificable del contrato}

## Pendientes
- {dato o decisión pendiente real}

## Notas de uso
- Mantener este contrato mínimo: queries, mutaciones, datos y errores.
- No incluir contratos internos si no son necesarios para la UI.
- No crear sección `Fuera de alcance` por defecto.
