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
import { PasswordInput } from './PasswordInput'
import {
  loginInitialValues,
  loginSchema,
  type LoginFormValues,
} from '../schemas/login.schema'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const formik = useFormik<LoginFormValues>({
    initialValues: loginInitialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const success = await login(values.correo, values.password)

      if (!success) {
        toast.error('El correo o la contraseña son incorrectos.')
        setSubmitting(false)
        return
      }

      toast.success('Inicio de sesión exitoso.')
      navigate('/')
    },
  })

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a Peluchera Stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forget-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
              />
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={formik.isSubmitting}>
              Ingresar
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
