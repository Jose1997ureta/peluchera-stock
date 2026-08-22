# Recuperar Contraseña Feature

## Versión
v1-family-low-security (implementada y verificada en Supabase Cloud)

## Objetivo
Permitir que un usuario que olvidó su contraseña la restablezca desde una pantalla dedicada, sin depender de un correo con link mágico: primero valida que el email ingresado exista, y si existe, permite definir una contraseña nueva directamente ahí mismo. Pensado explícitamente para uso familiar/interno con pocos usuarios de confianza — se prioriza simplicidad de UX sobre las prácticas de seguridad estándar de "recuperación de contraseña" (ver sección "Trade-offs de seguridad aceptados").

## Alcance
- En `LoginPage`, el botón/link **"¿Olvidaste tu contraseña?"** (hoy sin acción, ver `spec/auth/login-feature.md`) navega a una nueva ruta `/forget-password`.
- **Pantalla `ForgotPasswordPage`**, con dos pasos manejados como estado local del mismo componente (sin cambiar de URL entre pasos):
  1. **Paso "email"**: formulario con un único campo de correo y botón **"Continuar"**. Al enviarlo, se valida si ese correo existe entre los usuarios registrados (Supabase Auth).
     - Si no existe: mensaje de error en el mismo formulario, el usuario puede corregir y reintentar.
     - Si existe: se avanza al paso "password", guardando el correo validado en el estado local del componente.
  2. **Paso "password"**: formulario con **"Nueva contraseña"**, **"Confirmar contraseña"** (ambos con el mismo `PasswordInput` con toggle de mostrar/ocultar que ya se usa en login/registro) y botón **"Confirmar"**. Además, un botón/link **"Volver"** que regresa al paso "email" (limpia el paso "password" pero conserva el correo ya tipeado en el campo de email).
     - Al confirmar con ambas contraseñas válidas y coincidentes, se actualiza la contraseña del usuario dueño de ese correo, sin pedir la contraseña anterior ni iniciar sesión.
- Tras un restablecimiento exitoso: mensaje de éxito y redirección a `/login` para que el usuario inicie sesión con la contraseña nueva.
- **Loading state**: mientras cualquiera de los dos formularios está enviando (`isSubmitting` de Formik), el botón de submit muestra un spinner (`Loader2` de `lucide-react`, con `animate-spin`) además de deshabilitarse, y todos los campos de ese formulario (incluido "Volver" en el paso "password") quedan deshabilitados hasta que la llamada resuelve.

## Reglas objetivo
- **Paso "email"**: `correo` requerido, formato de email (mismo criterio que `login.schema.ts`/`register.schema.ts`).
- **Verificación de existencia**: se resuelve contra Supabase Auth real (no contra ningún mock) — un correo "existe" si hay un usuario de `auth.users` con ese email exacto.
- **Paso "password"**: `password` requerido, mínimo 8 caracteres (misma regla que `registerSchema`); `confirmarPassword` requerido e igual a `password`.
- **Reset directo, sin verificación adicional de identidad**: no se envía correo de confirmación, no se pide la contraseña anterior, no se valida ningún código/token. Cualquiera que conozca un correo registrado puede resetear esa contraseña desde esta pantalla. Es un trade-off consciente y aceptado dado el uso familiar/interno (ver "Trade-offs de seguridad aceptados").
- Todo el reset (verificar + actualizar) se resuelve del lado del servidor con privilegios de administrador (`service_role`), nunca expuesto al cliente — el navegador nunca ve ni maneja esa clave.

## Vistas afectadas
- **`LoginPage`**: el botón "¿Olvidaste tu contraseña?" pasa de sin acción a `<Link to="/forget-password">`.
- **`ForgotPasswordPage`** (`src/features/auth/components/ForgotPasswordPage.tsx`): layout de card centrada igual al de `LoginPage`/`RegisterPage`, con los dos pasos ("email"/"password") como JSX condicional dentro del mismo componente (no se separaron en subcomponentes propios, dado el tamaño acotado de cada formulario).

## Política de estado
- `ForgotPasswordPage` mantiene un estado local `step: 'email' | 'password'` y el `correo` ya validado, sin persistir nada en localStorage ni en `AuthContext` (este flujo no crea sesión).
- Cada paso usa su propio formulario Formik con su propio schema Yup (`forgotPasswordEmailSchema`, `resetPasswordSchema`), igual patrón que login/registro.
- "Continuar" (paso email) y "Confirmar" (paso password) son llamadas directas a Edge Functions de Supabase (no pasan por TanStack Query, siguiendo el mismo patrón que `login`/`register` en `AuthContext`, que tampoco usan TanStack Query).
- No se agrega nada a `AuthContext`: este flujo es completamente anónimo (nunca hay sesión iniciada durante el proceso).

## Contratos de datos
- Schemas Yup (`src/features/auth/schemas/forgotPassword.schema.ts`):
  - `forgotPasswordEmailSchema`: `{ correo: string (required, email) }`.
  - `resetPasswordSchema`: `{ password: string (required, min 8), confirmarPassword: string (required, oneOf [password]) }`.
- Cliente (`src/features/auth/api/forgotPassword.ts`): `checkEmailExists(correo)` y `resetPassword(correo, password)`, ambas invocan las Edge Functions vía `supabase.functions.invoke(...)`.
- **Edge Function `check-email-exists`** (`supabase/functions/check-email-exists/index.ts`):
  - Request: `{ correo: string }`.
  - Response: `{ exists: boolean }` (200) o `{ error: string }` (400 si falta `correo`, 500 ante error inesperado).
  - Implementación: cliente Supabase con `service_role` (`supabase/functions/_shared/adminClient.ts`, nunca el anon key), pagina `auth.admin.listUsers` y busca coincidencia exacta de email (case-insensitive) — el SDK de Deno usado no expone `getUserByEmail`.
- **Edge Function `reset-password`** (`supabase/functions/reset-password/index.ts`):
  - Request: `{ correo: string, password: string }`.
  - Response: `{ success: true }` (200), `{ error: string }` (400 si `password` no cumple el mínimo, 404 si el correo ya no existe, 500 ante error inesperado).
  - Implementación: mismo cliente `service_role`, resuelve el `id` del usuario por email (mismo helper `findUserByEmail`) y llama `supabase.auth.admin.updateUserById(id, { password })`.
  - No requiere el usuario autenticado ni valida la contraseña anterior.
- Ambas funciones registradas con `verify_jwt = false` en `supabase/config.toml` (se llaman sin sesión activa, antes del login) y manejan `OPTIONS`/CORS manualmente (`supabase/functions/_shared/cors.ts`) porque no pasan por el cliente autenticado del navegador.

## Trade-offs de seguridad aceptados
- **Enumeración de usuarios**: cualquiera puede probar correos y averiguar cuáles están registrados en la app (el paso "email" responde explícitamente `existe`/`no existe`). Aceptado porque la app es de uso familiar/interno, no pública.
- **Reset sin prueba de identidad**: no hay verificación de que quien resetea la contraseña sea el dueño real del correo (no hay link enviado al correo, ni código, ni contraseña anterior). Cualquiera con acceso a la app y conocimiento de un correo registrado puede tomar esa cuenta. Aceptado explícitamente por el usuario para esta versión — **no usar este patrón si la app pasa a tener usuarios externos/no confiables**.
- Ambas Edge Functions son públicas (sin requerir un JWT de usuario autenticado, ya que el flujo es pre-login), por lo que no tienen rate-limiting propio en esta versión — queda fuera de alcance salvo que se vuelva un problema real.

## Errores esperados y recuperación
- Correo con formato inválido o vacío (Yup): el input se marca visualmente en error, sin bloquear con texto, igual criterio que login/registro.
- Correo válido pero no registrado: mensaje **"No encontramos una cuenta con ese correo."** en el paso "email", se mantiene ahí, el usuario puede corregir y reintentar.
- Password/confirmación inválidos (menos de 8 caracteres o no coinciden): marca visual en el input, sin texto, submit bloqueado.
- Falla de red/servidor en cualquiera de las dos Edge Functions: toast de error genérico **"Ocurrió un error, intentá de nuevo."**, sin perder el paso ni los datos ya ingresados.
- Reset exitoso: toast **"Contraseña actualizada correctamente."** y redirección a `/login`.
- Botón "Volver" desde el paso "password": vuelve al paso "email" sin llamar a ningún endpoint, conservando el correo ya tipeado.

## Navegación relevante
- Nueva ruta pública `/forget-password` en `src/app/routes.tsx`, envuelta en `GuestGuard` (igual que `/login` y `/register` — si ya hay sesión activa, redirige a `/dashboard`).
- `LoginPage`: "¿Olvidaste tu contraseña?" now es un `Link` a `/forget-password`.
- Reset exitoso -> redirección a `/login`.

## Profundidad en Supabase
- Requiere dos Edge Functions nuevas (`check-email-exists`, `reset-password`) que usan la `service_role key` de Supabase (variable de entorno del lado de la función, nunca del cliente) para llamar al Admin API de Auth.
- No requiere cambios de schema en la base de datos ni nuevas tablas — opera directamente sobre `auth.users` vía Admin API.

## Verificación realizada
- Ambas Edge Functions desplegadas en el proyecto de Supabase Cloud (deploy manual del usuario vía `supabase functions deploy`).
- Probado en navegador end-to-end: correo inexistente → mensaje de error sin avanzar de paso; correo existente → avanza al paso "password"; botón "Volver" regresa al paso "email" conservando el valor tipeado; loading state visible (spinner + campos deshabilitados) durante la llamada a `check-email-exists`.
- No se ejecutó el submit final de `reset-password` contra una cuenta real durante la verificación (para no alterar una contraseña real sin que el usuario lo pidiera explícitamente) — la función fue probada de forma aislada por `curl` confirmando `{"exists": true/false}` correctos, pero el camino feliz completo de "Confirmar" en el paso "password" queda pendiente de que el usuario lo pruebe él mismo o autorice explícitamente un reset de prueba.

## Preguntas abiertas
- Ninguna sobre alcance o trade-offs de seguridad (confirmados explícitamente por el usuario: uso familiar, prioriza simplicidad). Pendiente únicamente la verificación manual del submit final de "Confirmar" en el paso "password" contra una cuenta real (ver "Verificación realizada").
