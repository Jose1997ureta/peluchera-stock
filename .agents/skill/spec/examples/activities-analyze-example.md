# Ejemplo — modo `analyze-existing-feature`

> Documento de ejemplo ilustrativo. Muestra el formato de salida esperado al analizar un feature ya implementado en este repositorio. Describe una implementación hipotética de `activities` para ilustrar el formato — úsalo como referencia de estilo, no como spec vigente.

---

# Activities Feature

## Versión
v0-objective-draft

## Objetivo
Definir el comportamiento objetivo de la gestión de actividades a partir de la implementación existente en `src/features/activities` y las decisiones confirmadas por el usuario.

## Alcance analizado
- Feature: `src/features/activities` — sí
- Hooks de datos: `src/features/activities/hooks/api.ts`, `useActivities`, `useCreateActivity`, `useCloseActivity` — sí
- Schema de validación: `src/features/activities/schemas/activity.schema.ts` — sí
- Supabase: tablas `activities`, `activity_products`, función RPC `close_activity` — sí
- Navegación: `/actividades`, `/actividades/:id` en `src/app/routes.tsx` — sí
- UI compartida: `src/shared/components/ui` (Card, Dialog, Badge de beUI) — sí

## Alcance objetivo
- Crear una actividad con nombre, descripción y productos asignados con `initial_qty`.
- Listar actividades filtradas por estado, con `open` como filtro por defecto.
- Editar `sold_qty` de cada línea mientras la actividad está abierta.
- Cerrar la actividad de forma atómica: descuenta stock real, calcula resumen de montos, cambia estado a `closed`.

## Reglas objetivo
- El precio unitario de cada línea (`unit_price`) se copia del producto al momento de agregarlo a la actividad; cambios posteriores de precio del producto no afectan actividades ya creadas.
- `sold_qty` no puede superar `initial_qty` en ninguna línea.
- El cierre de actividad se ejecuta mediante la función RPC `close_activity`, no mediante múltiples updates sueltos desde el cliente.

## Brechas detectadas en la implementación actual
- La validación de `sold_qty <= initial_qty` está solo en el schema de Yup del cliente; no hay `CHECK constraint` equivalente en Postgres, por lo que una llamada directa a la API de Supabase podría saltarse la regla.
- La función RPC `close_activity` no está envuelta en una transacción explícita: si falla a mitad de la actualización de varios productos, el stock podría quedar parcialmente actualizado.

## Confirmado por implementación
- Existe `ActivitiesPage` en `/actividades` con filtro de estado, `open` seleccionado por defecto.
- Existe `ActivitySessionPage` en `/actividades/:id` que lista las líneas de `activity_products` y permite editar `sold_qty`.
- El botón "Cerrar actividad" invoca `useCloseActivity`, que llama a la función RPC `close_activity`.
- El resumen de montos se calcula en el cliente sumando `unit_price * initial_qty` (estimado) y `unit_price * sold_qty` (real).

## Inferido, requiere validación
- Que el resumen de montos deba recalcularse también en el servidor (hoy solo se calcula en el cliente antes de cerrar).
- Que una actividad cerrada no deba permitir ninguna edición posterior de sus líneas.

## No definido aún
- Qué pasa si se intenta cerrar una actividad sin haber editado `sold_qty` de ninguna línea (¿se asume 0 vendido en todas?).
- Si se puede eliminar una línea de `activity_products` mientras la actividad está abierta.

## Riesgos de arquitectura
- Regla de negocio (`sold_qty <= initial_qty`) validada solo en el cliente (Yup), sin respaldo a nivel de base de datos.
- Cálculo de montos duplicado entre cliente y lo que finalmente persiste la función RPC, con riesgo de divergencia si uno de los dos cambia sin actualizar el otro.

## Preguntas abiertas
- ¿Se agrega un `CHECK constraint` en Postgres para `sold_qty <= initial_qty` además de la validación de Yup?
- ¿La función RPC debe envolver la actualización de stock en una transacción explícita?
- ¿Una actividad cerrada permite algún tipo de corrección posterior, o es completamente inmutable?

## Criterio de uso
Este documento define un objetivo inicial. Las brechas indican diferencias que deben alinearse antes de considerar completo el feature.
