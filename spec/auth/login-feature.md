# Login Feature

## Versión
v0-objective-draft

## Objetivo
Permitir que un usuario inicie sesión con correo y contraseña, validando localmente contra la copia mutable de usuarios en localStorage (`peluchera_stock_mock_users`, sembrada desde `shared/data/mock-users.json` y donde también se agregan los usuarios nuevos, ver `spec/auth/register-feature.md`) — sin Supabase por ahora — y mantener la sesión persistida como si fuera real, hasta el día en que se migre a Supabase Auth.

## Alcance objetivo
- Formulario de login con únicamente dos campos: correo y contraseña.
- Link "Olvidé mi contraseña" visible con apariencia normal (no atenuado ni deshabilitado), pero sin ninguna acción al hacer click en esta versión (queda para una próxima).
- Validar las credenciales ingresadas contra `shared/data/mock-users.json`.
- Al loguear correctamente: guardar el usuario logueado en localStorage y exponerlo mediante un `AuthContext`, y mostrar un mensaje de éxito.
- Si las credenciales no coinciden con ningún usuario del mock: mostrar un mensaje de error amigable, sin iniciar sesión.
- Los campos inválidos (vacíos o con formato incorrecto) se marcan visualmente en el input, sin mensaje de texto.
- Rutas protegidas de la app redirigen a `/login` si no hay sesión activa en el `AuthContext`.

## Reglas objetivo
- El login compara `correo` y `password` ingresados contra las entradas de `peluchera_stock_mock_users` (localStorage), con coincidencia **exacta** (case-sensitive, sin normalizar mayúsculas/minúsculas en ningún campo). Coincidencia exacta de ambos campos habilita la sesión.
- Si no hay ninguna coincidencia, se muestra un único mensaje de error genérico (no se distingue si falló el correo o la contraseña, por buena práctica de UX/seguridad).
- El usuario logueado que se persiste **nunca incluye el campo `password`** — solo nombre, apellido, correo, teléfono y fecha de nacimiento.
- Este mecanismo es temporal e intencional: el día que se conecte Supabase, la función interna de "login" se reemplaza por `supabase.auth.signInWithPassword`, manteniendo la misma forma de `AuthContext` (mismo shape de usuario logueado) para minimizar el impacto en el resto de la app.
- Comparar contra un JSON en texto plano es aceptable únicamente porque es data mock de desarrollo (ver `shared/data/README.md`) — esta regla deja de aplicar en cuanto exista Supabase Auth.

## Vistas afectadas
- No aplica (layout responsivo estándar, sin diferencias de comportamiento entre desktop y mobile).

## Política de estado
- `AuthContext` (React Context, en `shared/`) expone el usuario logueado actual y una función `login(correo, password)`.
- Al montar la app, `AuthContext` hidrata su estado leyendo el usuario persistido en localStorage (si existe), para que recargar la página no cierre la sesión.
- El formulario (Formik) mantiene `correo` y `password` en su propio estado local mientras el usuario escribe; no toca el `AuthContext` hasta que el submit resuelve exitosamente.
- El logout queda fuera de alcance de esta spec; se documentará en la spec de Profile.

## Contratos de datos
- Schema de validación: `src/features/auth/schemas/login.schema.ts` (Yup) — `correo`: requerido, formato de email; `password`: requerido.
- Fuente de datos (temporal): `peluchera_stock_mock_users` en localStorage (sembrada desde `src/shared/data/mock-users.json`, ver `spec/auth/register-feature.md`) — se compara `correo` y `password` de cada entrada.
- Forma del usuario logueado persistido: `{ nombre, apellido, correo, telefono, fechaNacimiento }` (sin `password`).

## Persistencia
- Usuario logueado: localStorage, clave `peluchera_stock_auth_user` — reemplazable 1:1 el día de la migración por la sesión de Supabase Auth.
- Contraseña ingresada en el formulario: solo en memoria del estado de Formik, nunca se persiste.

## Errores esperados y recuperación
- Credenciales sin coincidencia en el mock: mensaje de error amigable **"El correo o la contraseña son incorrectos."** (toast), el formulario no se limpia y el usuario puede reintentar.
- Campo vacío o con formato inválido (Yup): el input pasa a su estado visual de error (borde), sin texto de error debajo; el submit no se dispara mientras el formulario sea inválido.
- Login exitoso: mensaje de éxito **"Inicio de sesión exitoso."** (toast) antes o durante la redirección al dashboard.

## Navegación relevante
- Ruta registrada: `/login` en `src/app/routes.tsx`, pública (sin requerir sesión).
- Rutas públicas (no requieren sesión): `/login`, `/register` y `/forget-password` (estas dos últimas se agregarán más adelante). Todas las demás rutas de la app son protegidas.
- Login exitoso -> redirección al dashboard (ruta `/`).
- Ruta protegida sin sesión -> `AuthGuard` redirige a `/login`.

## Profundidad en Supabase
- No aplica en esta iteración: toda la validación de login es local, contra `shared/data/mock-users.json`. La migración a Supabase Auth se documentará en una spec de cambio (`spec/auth/migrate-to-supabase-auth-spec-review.md`) cuando corresponda.

## Brechas detectadas en la implementación actual
- `No definido aún en esta versión.` (feature aún no implementada).

## Criterios de aceptación
- Un usuario presente en `mock-users.json` con correo y password correctos (coincidencia exacta) inicia sesión, ve el mensaje "Inicio de sesión exitoso." y es redirigido al dashboard (`/`).
- Un intento con credenciales que no existen en el mock muestra el mensaje "El correo o la contraseña son incorrectos." y no inicia sesión.
- Un campo vacío o con formato inválido se marca visualmente en el input, sin mostrar texto de error, y bloquea el submit.
- Al recargar la página después de un login exitoso, el usuario sigue logueado.
- Acceder a una ruta protegida (cualquiera que no sea `/login`, `/register` o `/forget-password`) sin sesión activa redirige a `/login`.
- Ningún `password` (ni el ingresado ni el del mock) queda persistido en localStorage ni en el estado del `AuthContext`.

## Preguntas abiertas
Ninguna pendiente en esta versión.
