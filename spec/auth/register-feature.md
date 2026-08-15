# Register Feature

## Versión
v0-objective-draft

## Objetivo
Permitir que un usuario nuevo se registre desde un link visible en la pantalla de login, completando un formulario con sus datos (nombre, apellido, correo, contraseña, teléfono, fecha de nacimiento), agregándolo a la copia mutable de usuarios en localStorage (`peluchera_stock_mock_users`, la misma que ya usa `AuthContext` para login y Profile) — sin Supabase por ahora — y redirigirlo a `/login` una vez registrado, sin iniciar sesión automáticamente.

## Alcance objetivo
- Link "Registrarse" (o similar) visible en la pantalla de login, que navega a `/register`.
- Formulario de registro con los campos: nombre, apellido, correo, contraseña, confirmar contraseña, teléfono, fecha de nacimiento.
- Validar que el correo ingresado no exista ya entre los usuarios de `peluchera_stock_mock_users`.
- Al registrar correctamente: agregar el nuevo usuario a `peluchera_stock_mock_users`, mostrar un mensaje de éxito y redirigir a `/login` (sin loguear automáticamente).
- Si el correo ya existe: mostrar un mensaje de error amigable, sin registrar al usuario.
- Los campos inválidos (vacíos o con formato incorrecto) se marcan visualmente en el input, sin mensaje de texto, igual que en el login.

## Reglas objetivo
- `nombre` y `apellido`: requeridos, texto no vacío.
- `correo`: requerido, formato de email válido, y no debe existir ya entre los usuarios de `peluchera_stock_mock_users` (comparación exacta, sin normalizar mayúsculas/minúsculas, igual criterio que el login).
- `password`: requerido, mínimo 8 caracteres, sin reglas adicionales de complejidad en esta versión.
- `confirmarPassword`: requerido, debe coincidir exactamente con `password`.
- `telefono`: mismo criterio ya usado en `ProfileInfoSection` (`spec/profile/profile-feature.md`) — código de país fijo `PHONE_DIAL_CODE` (`shared/utils/phone.ts`, no editable por el usuario) + 9 dígitos numéricos, reutilizando `composePhone`/`extractPhoneDigits`/`formatPhoneNumber`/`parsePhoneNumber` en vez de reimplementar el parsing.
- `fechaNacimiento`: mismo campo que `ProfileInfoSection` (`<Input type="date">` nativo), no puede ser una fecha futura, y además — a diferencia de Profile, que no valida edad — debe corresponder a una edad mínima de 18 años calculada al momento del registro.
- El usuario registrado que se persiste **nunca incluye el campo `confirmarPassword`** (solo se usa para validar en el formulario, no se guarda).
- Este mecanismo es temporal e intencional: el día que se conecte Supabase, la función interna de "registro" se reemplaza por `supabase.auth.signUp` (+ guardado del resto de los campos en una tabla de perfil), manteniendo el mismo shape de datos para minimizar el impacto en el resto de la app.
- Guardar `password` en texto plano en localStorage es aceptable únicamente porque es data mock de desarrollo (ver `shared/data/README.md`) — esta regla deja de aplicar en cuanto exista Supabase Auth.

## Vistas afectadas
- No aplica (layout responsivo estándar, sin diferencias de comportamiento entre desktop y mobile).

## Política de estado
- El formulario (Formik) mantiene todos los campos en su propio estado local mientras el usuario escribe.
- `AuthContext` expone una función `register`, análoga a `login`/`updateProfile`, que agrega el usuario nuevo a la misma lista mutable que ya leen/escriben `login` y `updateProfile` (`peluchera_stock_mock_users`).
- Al registrar exitosamente, el `AuthContext` no autentica al usuario (no llama a `setUser`/`persistSession`) — el usuario no queda logueado, debe iniciar sesión manualmente en `/login`.

## Contratos de datos
- Schema de validación: `src/features/auth/schemas/register.schema.ts` (Yup) — `nombre`, `apellido`: requeridos; `correo`: requerido, formato email; `password`: requerido, mínimo 8 caracteres; `confirmarPassword`: requerido, debe coincidir con `password`; `telefono`: requerido, exactamente 9 dígitos numéricos vía el mismo `matches` que usa `profileInfoSchema` (`src/features/profile/schemas/profile.schema.ts`); `fechaNacimiento`: requerida, no futura (mismo `yup.date().max(new Date())` que `profileInfoSchema`), más una validación adicional de edad mínima 18 años que Profile no tiene.
- Reutilizar de `shared/utils/phone.ts`: `PHONE_DIAL_CODE`, `composePhone`, `extractPhoneDigits`, `formatPhoneNumber`, `parsePhoneNumber` — no reimplementar el parsing/formato de teléfono dentro de la feature de auth.
- Fuente de datos: la misma lista mutable que ya usa `AuthContext` (`peluchera_stock_mock_users` en localStorage, sembrada desde `shared/data/mock-users.json`) — tanto el chequeo de correo duplicado como el login existente leen de ahí.
- Forma del usuario persistido: `{ nombre, apellido, correo, password, telefono, fechaNacimiento }` (mismo shape `MockUser` que ya usa `AuthContext.tsx`).

## Persistencia
- Usuario registrado: localStorage, clave `peluchera_stock_mock_users` (misma clave que ya usan `login`/`updateProfile`/`updateAvatar` en `AuthContext.tsx`) — reemplazable 1:1 el día de la migración por `supabase.auth.signUp` + tabla de perfil.
- Contraseña y confirmación ingresadas en el formulario: solo en memoria del estado de Formik hasta el submit; luego la contraseña se persiste en `peluchera_stock_mock_users` junto al resto del usuario (mismo criterio temporal ya aceptado para esa clave).

## Errores esperados y recuperación
- Correo ya registrado (en `peluchera_stock_mock_users`): mensaje de error amigable **"Ya existe una cuenta con ese correo."** (toast), el formulario no se limpia y el usuario puede corregir el correo o ir a login.
- Campo vacío o con formato inválido (Yup), incluyendo `confirmarPassword` que no coincide o `fechaNacimiento` que no cumple la edad mínima: el input pasa a su estado visual de error (borde), sin texto de error debajo; el submit no se dispara mientras el formulario sea inválido.
- Registro exitoso: mensaje de éxito **"Registro exitoso. Ahora puedes iniciar sesión."** (toast), seguido de redirección a `/login`.

## Navegación relevante
- Ruta registrada: `/register` en `src/app/routes.tsx`, pública (no requiere sesión), consistente con lo ya documentado en `spec/auth/login-feature.md`.
- Login (`/login`) -> link "Registrarse" -> `/register`.
- Registro exitoso -> redirección a `/login` (sin sesión iniciada).

## Profundidad en Supabase
- No aplica en esta iteración: todo el registro es local, contra `peluchera_stock_mock_users` en localStorage. La migración a Supabase Auth (`supabase.auth.signUp` + tabla de perfil para nombre/apellido/teléfono/fecha de nacimiento) se documentará en una spec de cambio (`spec/auth/migrate-to-supabase-auth-spec-review.md`) cuando corresponda, en conjunto con la migración de login.

## Brechas detectadas en la implementación actual
- `No definido aún en esta versión.` (feature aún no implementada).

## Criterios de aceptación
- Desde `/login`, hacer click en el link de registro navega a `/register`.
- Completar el formulario con un correo que no existe en `peluchera_stock_mock_users`, con todos los campos válidos, registra al usuario, muestra "Registro exitoso. Ahora puedes iniciar sesión." y redirige a `/login`.
- Intentar registrar con un correo que ya existe en `peluchera_stock_mock_users` muestra "Ya existe una cuenta con ese correo." y no registra al usuario.
- `password` y `confirmarPassword` que no coinciden bloquean el submit y marcan el campo visualmente, sin texto de error.
- Una fecha de nacimiento que resulte en menos de 18 años, o una fecha futura, bloquea el submit y marca el campo visualmente.
- Un campo vacío o con formato inválido se marca visualmente en el input, sin mostrar texto de error, y bloquea el submit.
- Después de un registro exitoso, el usuario nuevo puede loguearse en `/login` con el correo y contraseña recién registrados.
- Ningún `confirmarPassword` queda persistido en localStorage.

## Preguntas abiertas
Ninguna pendiente en esta versión.
