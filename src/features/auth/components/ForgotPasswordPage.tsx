import { useFormik } from 'formik'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkEmailExists, resetPassword } from '../api/forgotPassword'
import {
  forgotPasswordEmailInitialValues,
  forgotPasswordEmailSchema,
  resetPasswordInitialValues,
  resetPasswordSchema,
  type ForgotPasswordEmailFormValues,
  type ResetPasswordFormValues,
} from '../schemas/forgotPassword.schema'
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
import { toast } from '@/shared/lib/toast'
import { PasswordInput } from './PasswordInput'

type Step = 'email' | 'password'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [correo, setCorreo] = useState('')

  const emailFormik = useFormik<ForgotPasswordEmailFormValues>({
    initialValues: forgotPasswordEmailInitialValues,
    validationSchema: forgotPasswordEmailSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const exists = await checkEmailExists(values.correo)
        if (!exists) {
          setFieldError('correo', 'No encontramos una cuenta con ese correo.')
          return
        }
        setCorreo(values.correo)
        setStep('password')
      } catch {
        toast.error('Ocurrió un error, intentá de nuevo.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const resetFormik = useFormik<ResetPasswordFormValues>({
    initialValues: resetPasswordInitialValues,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPassword(correo, values.password)
        toast.success('Contraseña actualizada correctamente.')
        navigate('/login')
      } catch {
        toast.error('Ocurrió un error, intentá de nuevo.')
        setSubmitting(false)
      }
    },
  })

  function handleVolver() {
    resetFormik.resetForm()
    setStep('email')
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Ingresá tu correo para verificar tu cuenta.'
              : 'Ingresá tu nueva contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={emailFormik.handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  value={emailFormik.values.correo}
                  onChange={emailFormik.handleChange}
                  onBlur={emailFormik.handleBlur}
                  disabled={emailFormik.isSubmitting}
                  aria-invalid={Boolean(emailFormik.touched.correo && emailFormik.errors.correo)}
                />
                {emailFormik.touched.correo && emailFormik.errors.correo ? (
                  <p className="text-sm text-destructive">{emailFormik.errors.correo}</p>
                ) : null}
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={emailFormik.isSubmitting}>
                {emailFormik.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Continuar
              </Button>
            </form>
          ) : (
            <form onSubmit={resetFormik.handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Nueva contraseña</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={resetFormik.values.password}
                  onChange={resetFormik.handleChange}
                  onBlur={resetFormik.handleBlur}
                  disabled={resetFormik.isSubmitting}
                  aria-invalid={Boolean(
                    resetFormik.touched.password && resetFormik.errors.password,
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmarPassword">Confirmar contraseña</Label>
                <PasswordInput
                  id="confirmarPassword"
                  name="confirmarPassword"
                  autoComplete="new-password"
                  value={resetFormik.values.confirmarPassword}
                  onChange={resetFormik.handleChange}
                  onBlur={resetFormik.handleBlur}
                  disabled={resetFormik.isSubmitting}
                  aria-invalid={Boolean(
                    resetFormik.touched.confirmarPassword && resetFormik.errors.confirmarPassword,
                  )}
                />
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={resetFormik.isSubmitting}>
                {resetFormik.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Confirmar
              </Button>

              <Button
                type="button"
                variant="link"
                size="sm"
                className="mx-auto"
                onClick={handleVolver}
                disabled={resetFormik.isSubmitting}
              >
                Volver
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
