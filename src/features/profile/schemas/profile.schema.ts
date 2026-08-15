import * as yup from 'yup'

export const AVATAR_IMAGE_MAX_SIZE_BYTES = 1 * 1024 * 1024
export const AVATAR_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ProfileInfoFormValues {
  nombre: string
  apellido: string
  phoneNumber: string
  fechaNacimiento: string
}

export const profileInfoSchema = yup.object({
  nombre: yup.string().trim().required(),
  apellido: yup.string().trim().required(),
  phoneNumber: yup
    .string()
    .required()
    .matches(/^\d{9}$/, ''),
  fechaNacimiento: yup.date().typeError('').required().max(new Date()),
})

export interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const changePasswordInitialValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required(),
  newPassword: yup.string().required().min(6),
  confirmPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('newPassword')], ''),
})
