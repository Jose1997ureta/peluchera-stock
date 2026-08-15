import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuth } from '@/shared/context/AuthContext'
import { toast } from '@/shared/lib/toast'
import { composePhone, extractPhoneDigits, formatPhoneNumber, PHONE_DIAL_CODE } from '@/shared/utils/phone'
import { PasswordInput } from './PasswordInput'
import {
  registerInitialValues,
  registerSchema,
  type RegisterFormValues,
} from '../schemas/register.schema'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const formik = useFormik<RegisterFormValues>({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const success = await register({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        correo: values.correo,
        password: values.password,
        telefono: composePhone(values.phoneNumber),
        fechaNacimiento: values.fechaNacimiento,
      })

      if (!success) {
        toast.error('Ya existe una cuenta con ese correo.')
        setSubmitting(false)
        return
      }

      toast.success('Registro exitoso. Ahora puedes iniciar sesión.')
      navigate('/login')
    },
  })

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate para acceder a Peluchera Stock</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  autoComplete="given-name"
                  value={formik.values.nombre}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(formik.touched.nombre && formik.errors.nombre)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  autoComplete="family-name"
                  value={formik.values.apellido}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(formik.touched.apellido && formik.errors.apellido)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                value={formik.values.correo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.correo && formik.errors.correo)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phoneNumber">Teléfono</Label>
              <div className="flex gap-2">
                <span className="flex h-8 shrink-0 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
                  {PHONE_DIAL_CODE}
                </span>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  inputMode="numeric"
                  placeholder="999 999 999"
                  value={formatPhoneNumber(formik.values.phoneNumber)}
                  onChange={(event) =>
                    formik.setFieldValue('phoneNumber', extractPhoneDigits(event.target.value))
                  }
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(formik.touched.phoneNumber) && formik.errors.phoneNumber !== undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                value={formik.values.fechaNacimiento}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  Boolean(formik.touched.fechaNacimiento) &&
                  formik.errors.fechaNacimiento !== undefined
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmarPassword">Confirmar contraseña</Label>
              <PasswordInput
                id="confirmarPassword"
                name="confirmarPassword"
                autoComplete="new-password"
                value={formik.values.confirmarPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  Boolean(formik.touched.confirmarPassword) &&
                  formik.errors.confirmarPassword !== undefined
                }
              />
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={formik.isSubmitting}>
              Registrarme
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
