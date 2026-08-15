import { useFormik } from 'formik'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuth } from '@/shared/context/AuthContext'
import { toast } from '@/shared/lib/toast'
import {
  composePhone,
  extractPhoneDigits,
  formatPhoneNumber,
  parsePhoneNumber,
  PHONE_DIAL_CODE,
} from '@/shared/utils/phone'
import { profileInfoSchema, type ProfileInfoFormValues } from '../schemas/profile.schema'

export function ProfileInfoSection() {
  const { user, updateProfile } = useAuth()

  const formik = useFormik<ProfileInfoFormValues>({
    initialValues: {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      phoneNumber: user ? parsePhoneNumber(user.telefono) : '',
      fechaNacimiento: user?.fechaNacimiento ?? '',
    },
    validationSchema: profileInfoSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await updateProfile({
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          telefono: composePhone(values.phoneNumber),
          fechaNacimiento: values.fechaNacimiento,
        })
        toast.success('Perfil actualizado.')
      } catch {
        toast.error('No se pudo actualizar el perfil. Intentá de nuevo.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis datos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
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
                value={formik.values.apellido}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.apellido && formik.errors.apellido)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" name="correo" value={user.correo} disabled readOnly />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  aria-invalid={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
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
                aria-invalid={Boolean(
                  formik.touched.fechaNacimiento && formik.errors.fechaNacimiento,
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
