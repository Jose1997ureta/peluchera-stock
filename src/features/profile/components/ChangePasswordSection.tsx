import { useFormik } from 'formik'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  changePasswordInitialValues,
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../schemas/profile.schema'

export function ChangePasswordSection() {
  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: changePasswordInitialValues,
    validationSchema: changePasswordSchema,
    onSubmit: (_values, { resetForm, setSubmitting }) => {
      // Alcance visual limitado en esta versión (ver spec/profile/profile-feature.md):
      // el formulario valida con Yup pero no compara ni persiste ninguna contraseña
      // todavía. Se conecta a supabase.auth.updateUser cuando exista Supabase Auth.
      resetForm()
      setSubmitting(false)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(formik.touched.currentPassword && formik.errors.currentPassword)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(
                  formik.touched.confirmPassword && formik.errors.confirmPassword,
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
