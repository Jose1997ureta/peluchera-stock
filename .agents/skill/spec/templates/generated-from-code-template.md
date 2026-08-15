# {Feature Name}

## Versión
v0-objective-draft

## Objetivo
{Objetivo de comportamiento deseado, derivado del análisis y decisiones confirmadas}

## Alcance analizado
- Feature: `src/features/{ruta}` — {sí/no}
- Hooks de datos: `{ruta}/hooks/api.ts` o hooks de TanStack Query — {sí/no}
- Schema de validación: `src/features/{feature}/schemas/{entidad}.schema.ts` — {sí/no}
- Supabase: tablas/RPC involucradas — {sí/no}
- Navegación: `src/app/routes.tsx` — {sí/no}
- UI compartida: `src/shared/components/ui` — {sí/no}

## Alcance objetivo
- {comportamiento que la feature debe cumplir}

## Reglas objetivo
- {regla confirmada o recomendada para alinear implementación}

## Brechas detectadas en la implementación actual
- {diferencia entre objetivo e implementación actual}

## Confirmado por implementación
- {hallazgo confirmado usado para el análisis}

## Inferido, requiere validación
- {hallazgo inferido que no debe convertirse en regla hasta confirmación}

## No definido aún
- {vacío real que requiere decisión}

## Riesgos de arquitectura
- {lógica de negocio dentro de un componente JSX en vez de un hook o RPC, llamadas a Supabase repetidas fuera de `api.ts`, estado duplicado entre cache de TanStack Query y estado local, cálculos de stock/montos hechos en el cliente cuando deberían vivir en una función de Postgres para garantizar atomicidad, valores hardcodeados que deberían venir de un schema o constante}

## Deuda técnica observada
- {código comentado que sugiere comportamiento no vigente}
- {duplicación con otra feature}
- {inconsistencia entre desktop y mobile}

## Preguntas abiertas
- {pregunta para cerrar vacíos}

## Criterio de uso
Este documento define un objetivo inicial basado en la implementación actual. Las brechas indican diferencias que deben alinearse antes de considerar la feature completa.
