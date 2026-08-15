# Ejemplo — modo `validate-change`

> Documento de ejemplo. Muestra el formato de salida esperado al validar una solicitud nueva contra specs existentes. No corresponde a un cambio real en curso.

---

# Close Activity Partial Refund Spec Review

## Versión
v0-review

## Solicitud
Al cerrar una actividad, permitir marcar una línea como "producto dañado" además de `sold_qty`, para que ese producto no vuelva al stock disponible aunque no se haya vendido.

## Specs revisadas
- `spec/activities/close-activity-flow.md`
- `spec/activities/activities-feature.md`

## Sin conflicto detectado
- La tabla `activity_products` puede extenderse con una columna nueva sin romper el contrato actual de `initial_qty`/`sold_qty`.
- El resumen de montos (estimado vs. real) no necesita cambiar: sigue calculándose sobre `sold_qty`.

## Conflicto con spec
- La regla objetivo actual dice que el stock devuelto es siempre `initial_qty - sold_qty`. Con "producto dañado", esa diferencia ya no puede devolverse completa al stock — hay que restar también la cantidad dañada.

## Decisión pendiente
- ¿La cantidad dañada es un campo independiente (`damaged_qty`) o se infiere como parte de `initial_qty - sold_qty` sin poder distinguirse de "no se sacó a vender"?
- ¿Un producto dañado afecta las métricas de rentabilidad del dashboard o se excluye del cálculo?
- ¿Esto aplica retroactivamente a actividades ya cerradas o solo hacia adelante?

## Clasificación del cambio
- cambio de lógica de negocio
- cambio de persistencia (columna nueva en `activity_products`)
- cambio en Supabase (la función RPC de cierre debe recalcular el stock devuelto)

## Impacto técnico
- `src/features`: `activities` y `activity-session` (UI para marcar cantidad dañada por línea).
- `src/shared/lib` (Supabase, TanStack Query): la mutación `useCloseActivity` debe enviar el nuevo campo.
- `src/features/<feature>/schemas`: schema de la línea de actividad (Yup) debe validar `damaged_qty` (0 ≤ damaged_qty ≤ initial_qty - sold_qty).
- `src/shared/types`: regenerar tipos de Supabase tras el cambio de esquema.
- Supabase (RPC/RLS): la función de cierre de actividad debe actualizarse para restar `sold_qty + damaged_qty` en vez de solo `sold_qty` al devolver stock.
- tests: no hay suite existente; si se pide cobertura, se crea desde cero para la función de cierre.

## Recomendación
Actualizar la spec antes de implementar porque el cambio modifica una regla de negocio central (la fórmula de devolución de stock al cerrar) y el esquema de Supabase.

## Texto sugerido para spec
Agregar a la spec de cierre de actividad:

- Cada línea de `activity_products` admite una `damaged_qty` opcional (default 0).
- Al cerrar la actividad, el stock del producto se actualiza como: `stock = stock - sold_qty - damaged_qty` (el resto de `initial_qty` sí vuelve a estar disponible).
- El resumen de montos (estimado/real) no incluye `damaged_qty`.
- `damaged_qty` no afecta las métricas de rentabilidad del dashboard, salvo que el usuario confirme lo contrario.
