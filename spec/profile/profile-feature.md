# Profile Feature

## Versión
v0-objective-draft

## Objetivo
Reemplazar el placeholder actual de `/perfil` por una página que le permita al usuario logueado ver y actualizar sus propios datos, subir/cambiar su foto de perfil, cambiar su contraseña (alcance visual en esta versión), elegir el tema de la app (claro/oscuro/sistema) y cerrar sesión — todo agrupado en secciones claras, simulado por completo contra `localStorage` (mismo mecanismo mock que Auth y Products), sin Supabase por ahora.

## Alcance objetivo
La página `/perfil` se organiza en secciones separadas y claramente tituladas, en este orden:

1. **Mis datos** — muestra y permite editar `nombre`, `apellido`, `teléfono` y `fecha de nacimiento` del usuario logueado. El `correo` se muestra en modo solo lectura (no editable en esta versión). Un botón "Guardar cambios" (deshabilitado si el formulario no tiene cambios o es inválido).
2. **Foto de perfil** — muestra el avatar actual (o iniciales, mismo fallback que ya usa `AppLayout`) con opción de subir una imagen nueva (reemplaza la anterior) y ver un preview antes de guardar. El mismo avatar (o su fallback de iniciales) también se muestra en el footer del sidebar (`AppLayout`), no solo en esta página — ambos leen `user.avatarUrl` de `AuthContext`, así que se actualizan juntos al subir una foto nueva.
3. **Seguridad** — formulario para cambiar contraseña: `contraseña actual`, `nueva contraseña`, `confirmar nueva contraseña`. Alcance visual limitado en esta versión: el formulario valida con Yup, pero el submit no ejecuta ningún cambio real (no valida la contraseña actual ni persiste la nueva) — queda listo para conectarse a `supabase.auth.updateUser` sin cambiar el formulario ni el schema.
4. **Preferencias** — selector de tema con tres opciones: **Claro**, **Oscuro** y **Sistema** (sigue `prefers-color-scheme` del SO). Aplica el cambio de inmediato, sin botón "Guardar" aparte.
5. **Cerrar sesión** — acción separada visualmente del resto (estilo destructivo/atención). Al hacer click abre un dialog de confirmación (mismo componente ya usado en Products para Activar/Desactivar/Eliminar, solo cambia texto y verbo); al confirmar, cierra la sesión y redirige a `/login`. Cancelar el dialog no hace nada.

Cada sección es su propia card (`card` de beUI), para que quede claro que son acciones independientes entre sí (guardar datos no afecta el tema, cambiar el tema no afecta la sesión, etc.).

## Reglas objetivo
- El `correo` nunca se edita desde esta página en esta versión — se muestra de solo lectura porque además es la clave de coincidencia del login mock (`shared/data/mock-users.json` / `AuthContext.login`); cambiarlo rompería ese match. Se revisa si se habilita a futuro cuando exista Supabase Auth.
- `nombre`, `apellido` y `teléfono` son requeridos; `fecha de nacimiento` es requerida y debe ser una fecha válida no futura. Estas reglas viven únicamente en `src/features/profile/schemas/profile.schema.ts` (Yup), no se duplican en el JSX.
- El campo `teléfono` se edita separado del código de país: el código de país se muestra fijo como `+51` (no editable en esta versión, ver `src/shared/utils/phone.ts`), y el número local se ingresa y valida como exactamente 9 dígitos, formateado en tiempo real como `999 999 999`. Al guardar, se compone y persiste como un único string (`+51 999 999 999`) en `AuthUser.telefono`, para no cambiar el contrato de dato existente.
- La foto de perfil sigue el mismo patrón que la imagen de producto (`spec/products/products-feature.md`): una sola imagen (no galería), hasta 5 MB, formatos `jpg`/`jpeg`/`png`/`webp`, se procesa a `data URL` recién al confirmar el submit de esa sección (mientras tanto solo preview local con `URL.createObjectURL`). En la implementación real contra Supabase Storage (bucket `avatars`), subir una foto nueva borra el objeto anterior del bucket una vez que el `avatar_url` del perfil se actualiza correctamente, para no dejar avatares huérfanos.
- El formulario de "Seguridad" valida con Yup: `contraseñaActual`, `nuevaContraseña` y `confirmarContraseña` requeridas; `nuevaContraseña` con mínimo 6 caracteres; `confirmarContraseña` debe coincidir con `nuevaContraseña`. Ninguna de las tres se compara ni persiste contra el mock — es validación de formulario únicamente, sin efecto funcional en esta versión (no se muestra error ni éxito de negocio, solo el estado de validación visual de los inputs).
- El selector de tema no depende de Supabase ni de ninguna librería nueva: se resuelve con un `ThemeContext` propio en `shared/context/ThemeContext.tsx`, agregando/quitando la clase `.dark` en `<html>` (ya soportada por los tokens de `src/index.css`) y escuchando `window.matchMedia('(prefers-color-scheme: dark)')` cuando la preferencia es "Sistema".
- Cerrar sesión pide confirmación (mismo componente de dialog que Products) antes de ejecutarse, porque el dispositivo puede ser compartido entre varios usuarios (sistema multi-usuario, ver `AGENTS.md` sección 1); al confirmar, limpia por completo la sesión persistida (ver Persistencia) y redirige a `/login`.
- Cambio técnico necesario en la capa de Auth: para que editar nombre/apellido/teléfono/fecha de nacimiento/avatar persista entre sesiones (y no se resetee al volver a loguear), `shared/data/mock-users.json` pasa a tener una copia mutable en `localStorage` (misma mecánica ya usada por Products, ver `spec/products/products-feature.md`), en vez de compararse solo contra el JSON estático como hace hoy `AuthContext.login`. El archivo JSON del repo sigue siendo solo la semilla inicial.

## Vistas afectadas
- **Desktop y mobile**: mismas secciones y mismo orden en ambos; en mobile las cards se apilan a una columna (sin cambios de comportamiento, solo de layout responsivo estándar de Tailwind).

## Política de estado
- Datos del usuario logueado (incluido avatar): siguen viviendo en `AuthContext` (React Context ya existente en `shared/context/AuthContext.tsx`), que se extiende con:
  - `updateProfile(datos)`: actualiza nombre/apellido/teléfono/fecha de nacimiento.
  - `updateAvatar(dataUrl)`: actualiza el avatar.
  - `logout()`: limpia la sesión.
  Ambas mutaciones actualizan la copia mutable de usuarios en `localStorage` y el usuario persistido de la sesión activa, y no pasan por TanStack Query (no son datos de Supabase todavía; siguen el mismo criterio que ya tiene `AuthContext.login`).
- El formulario de "Mis datos" y el de "Seguridad" son cada uno su propio `useFormik`, independientes entre sí y de la sección de avatar.
- Tema: vive en el nuevo `ThemeContext` (`shared/context/ThemeContext.tsx`), fuera de `AuthContext` porque el tema no depende de haber iniciado sesión (aplica también en `/login`, aunque esta spec no cubre esa pantalla).
- Selección de imagen de avatar: estado local del componente de la sección (preview), igual que en `ProductImageDropzone`.

## Contratos de datos
- Tipo `AuthUser` (`shared/context/AuthContext.tsx`) se extiende con `avatarUrl?: string`.
- Copia mutable de usuarios: `localStorage`, clave `peluchera_stock_mock_users` — array con la misma forma que `mock-users.json` más `avatarUrl?: string`. Al primer acceso, si la clave no existe, se siembra copiando `mock-users.json` (igual mecánica que `peluchera_stock_mock_products` en Products).
- Sesión activa persistida: `localStorage`, clave `peluchera_stock_auth_user` (ya existente) — se sigue guardando sin `password`, ahora incluyendo `avatarUrl` si existe.
- Preferencia de tema: `localStorage`, clave `peluchera_stock_theme` — valores `'light' | 'dark' | 'system'`, default `'system'`.
- Schema de validación: `src/features/profile/schemas/profile.schema.ts` (Yup), con dos schemas separados:
  - `profileInfoSchema`: `nombre`, `apellido` requeridos; `phoneNumber` requerido, exactamente 9 dígitos (número local, sin el código de país fijo `+51`, ver `src/shared/utils/phone.ts`); `fechaNacimiento` requerida, fecha válida, no futura.
  - `changePasswordSchema`: `currentPassword`, `newPassword`, `confirmPassword` requeridas; `newPassword` mínimo 6 caracteres; `confirmPassword` igual a `newPassword`.
- `avatarUrl`/imagen de producto: mismo límite ya definido en Products — 5 MB, `jpg`/`jpeg`/`png`/`webp`.

## Persistencia
- Datos de perfil y avatar: `localStorage` (`peluchera_stock_mock_users` + `peluchera_stock_auth_user`), reemplazable 1:1 por Supabase (tabla de usuarios/`auth.users` + Supabase Storage para el avatar) cuando se conecte.
- Cambio de contraseña: no persiste nada en esta versión (alcance visual limitado).
- Preferencia de tema: `localStorage` (`peluchera_stock_theme`), no se sincroniza con Supabase — es una preferencia local del dispositivo/navegador, no del usuario en el backend.

## Errores esperados y recuperación
- Campos inválidos en "Mis datos" o "Seguridad" (Yup): mismo patrón que Login/Products — el input se marca visualmente en rojo, sin texto de error debajo, y el submit de esa sección queda bloqueado.
- Guardar "Mis datos" exitoso: toast "Perfil actualizado.".
- Subir avatar exitoso: toast "Foto de perfil actualizada.".
- Envío del formulario de "Seguridad": no muestra toast de éxito ni de error de negocio en esta versión (solo bloquea el submit si la validación de Yup falla) — se documentará el mensaje real cuando se conecte a Supabase Auth.
- Cerrar sesión: no requiere estado de error (operación local, no puede fallar por red en esta versión). Cerrar el dialog de confirmación sin confirmar (botón "Cancelar", click afuera, o Esc) no cierra la sesión.

## Navegación relevante
- Ruta `/perfil` ya registrada en `src/app/routes.tsx` (placeholder) — esta spec la reemplaza por la implementación real (mock).
- Cerrar sesión redirige a `/login` y limpia el `AuthContext` (`user = null`), lo que además hace que `AuthGuard` bloquee cualquier ruta protegida hasta un nuevo login.
- El botón de usuario en el footer del sidebar (`src/app/AppLayout.tsx`), que ya navegaba a `/perfil`, ahora también muestra `user.avatarUrl` (con el mismo fallback de iniciales) en vez de mostrar siempre las iniciales.

## Profundidad en Supabase
- No aplica en esta iteración: todo el perfil es mock, contra `localStorage`. La migración a Supabase (Auth para datos de usuario y cambio de contraseña real vía `supabase.auth.updateUser`, Storage para el avatar) se documentará en una spec de cambio (`spec/profile/migrate-to-supabase-spec-review.md`) cuando corresponda, igual que quedó planteado para Auth y Products.

## Brechas detectadas en la implementación actual
- `ProfilePage` actual es solo un placeholder de texto — no implementa ninguna de las secciones de esta spec.
- `AuthContext` actual no tiene `logout()`, `updateProfile()` ni `updateAvatar()`, y compara el login siempre contra el JSON estático `mock-users.json` (sin copia mutable en `localStorage`) — ambos cambios son necesarios para esta spec.
- No existe ningún `ThemeContext` ni mecanismo de toggle de tema en el proyecto — hoy solo existen los tokens CSS de `.dark` en `src/index.css`, sin nada que agregue/quite esa clase.

## Criterios de aceptación
- Entrar a `/perfil` muestra los datos actuales del usuario logueado (nombre, apellido, correo de solo lectura, teléfono, fecha de nacimiento) y su avatar (o iniciales si no tiene).
- Editar nombre/apellido/teléfono/fecha de nacimiento con datos válidos y guardar actualiza la sección, muestra el toast "Perfil actualizado.", y persiste: cerrar sesión y volver a loguear con el mismo usuario muestra los datos editados, no los originales del mock.
- Dejar algún campo de "Mis datos" vacío o inválido bloquea el submit de esa sección sin afectar las demás.
- Subir una imagen válida como avatar la muestra en preview, y al confirmar reemplaza el avatar anterior, muestra el toast "Foto de perfil actualizada.", persiste entre sesiones igual que el resto de los datos, y se refleja también en el avatar del footer del sidebar sin recargar la página.
- El formulario de "Seguridad" valida contraseña actual/nueva/confirmación requeridas, nueva contraseña de al menos 6 caracteres y que ambas coincidan; enviarlo con datos válidos no produce ningún error visible ni cambia nada persistido (alcance visual).
- Cambiar el selector de tema a "Oscuro" aplica el modo oscuro de inmediato (clase `.dark` en `<html>`) y persiste entre recargas; "Claro" lo saca; "Sistema" sigue el `prefers-color-scheme` del sistema operativo y reacciona si el usuario lo cambia mientras la app está abierta.
- Hacer click en "Cerrar sesión" abre el dialog de confirmación; confirmar limpia la sesión (`AuthContext.user = null`, `localStorage` sin `peluchera_stock_auth_user`) y redirige a `/login`; intentar volver a una ruta protegida después redirige de nuevo a `/login`. Cancelar el dialog mantiene la sesión activa.
- Ningún campo de validación (perfil o cambio de contraseña) se duplica fuera de `profile.schema.ts`.
- Ningún archivo de esta feature importa `@supabase/supabase-js` ni el cliente `supabase`.

## Preguntas abiertas
Ninguna pendiente en esta versión.
