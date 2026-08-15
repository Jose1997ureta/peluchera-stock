# {Flow Name}

## Versión
v0-objective-draft

## Objetivo del flujo
{Qué debe lograr el flujo completo}

## Cuándo crear esta spec
- Usar solo si el flujo tiene valor propio: varias páginas, estado compartido (por ejemplo el "carrito" de productos de una actividad abierta), navegación relevante o reglas transversales.

## Entrada
- {condición o acción que inicia el flujo}

## Pasos del flujo
1. {paso objetivo} — {página / hook responsable}
2. {paso objetivo} — {página / hook responsable}
3. {paso objetivo} — {página / hook responsable}

## Reglas objetivo
- {regla transversal del flujo}

## Política de estado del flujo
- Estado compartido: {estado local de la página / cache de TanStack Query / tabla `activity_products` en Supabase}
- Cuándo se limpia: {evento, navegación fuera del flujo, cierre de la actividad}
- Qué pasa si el usuario recarga la página a mitad del flujo: {comportamiento esperado — normalmente se recupera desde Supabase, no se pierde}

## Navegación
- {origen} -> {destino}: {condición}

## Errores y recuperación
- {error}: {acción de recuperación}
- Falla la operación atómica de cierre (RPC): {comportamiento esperado — ninguna fila debe quedar a medio actualizar}
- Sesión expirada a mitad del flujo: {comportamiento esperado}

## Salidas
- {resultado esperado del flujo}

## Brechas detectadas en la implementación actual
- {diferencia entre objetivo e implementación actual}

## Criterios de aceptación
- {criterio verificable}

## Preguntas abiertas
- {decisión pendiente real}

## Notas de uso
- No crear flow spec si una feature spec y una page spec cubren suficiente contexto.
- No documentar responsabilidades de otros flujos solo para aclarar que no se implementan.
