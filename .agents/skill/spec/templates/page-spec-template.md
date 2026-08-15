# {Page Name}

## Versión
v0-objective-draft

## Objetivo
{Qué debe lograr la página/vista}

## Ubicación y acceso
- Archivo: `src/features/{feature}/{ArchivoPagina}.tsx`
- Ruta: {path registrado en `src/app/routes.tsx` / embebida en {página anfitriona} / no navegable}
- Acceso: {requiere sesión de Supabase Auth / público}

## Alcance objetivo
- {elemento visible, estado o comportamiento especificado}

## Estados UI objetivo
- {estado}: {significado y qué se muestra — ej. `loading`, `empty`, `error`, `content`}

## Eventos objetivo
- {evento}: {acción esperada o sin comportamiento funcional en v0}

## Reglas UI objetivo
- {regla UI/UX estable}

## Política de estado
- {hook de TanStack Query responsable y qué tabla/RPC consulta}
- {qué datos vive en el formulario Formik y cuáles vienen de la query}
- {qué se reinicia al entrar a la página y qué sobrevive (cache de query, estado local)}

## Datos requeridos
- {dato}: {origen — hook de query, mutación, parámetro de ruta}

## Errores y recuperación
- {error}: {comportamiento UI}
- Sesión expirada: {redirección a login}

## Navegación
- {navegación especificada}

## Diferencias entre desktop y mobile
- {diferencia real} o `No aplica.`

## Brechas detectadas en la implementación actual
- {diferencia entre objetivo e implementación actual}

## Criterios de aceptación
- {criterio verificable}

## Preguntas abiertas
- {decisión pendiente real}

## Notas de uso
- No documentar `Fuera de alcance` por defecto.
- Si un link, botón o elemento visual aún no tiene acción, documentarlo como visible sin flujo funcional.
- No inventar navegación, modales, columnas de Supabase o acciones no especificadas.
- Los textos van en español directamente en el componente (no hay sistema de configuración remota de copy en este proyecto).
