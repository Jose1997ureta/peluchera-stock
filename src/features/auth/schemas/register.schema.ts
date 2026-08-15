import * as yup from 'yup'
import { PHONE_NUMBER_DIGITS } from '@/shared/utils/phone'

const MIN_AGE_YEARS = 18

function isAtLeastMinAge(value?: Date | null): boolean {
  if (!value) return false
  const today = new Date()
  const minBirthDate = new Date(today.getFullYear() - MIN_AGE_YEARS, today.getMonth(), today.getDate())
  return value <= minBirthDate
}

export interface RegisterFormValues {
  nombre: string
  apellido: string
  correo: string
  password: string
  confirmarPassword: string
  phoneNumber: string
  fechaNacimiento: string
}

export const registerSchema = yup.object({
  nombre: yup.string().trim().required(),
  apellido: yup.string().trim().required(),
  correo: yup.string().email().required(),
  password: yup.string().required().min(8),
  confirmarPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('password')], ''),
  phoneNumber: yup
    .string()
    .required()
    .matches(new RegExp(`^\\d{${PHONE_NUMBER_DIGITS}}$`), ''),
  fechaNacimiento: yup
    .date()
    .typeError('')
    .required()
    .max(new Date())
    .test('min-age', '', isAtLeastMinAge),
})

export const registerInitialValues: RegisterFormValues = {
  nombre: '',
  apellido: '',
  correo: '',
  password: '',
  confirmarPassword: '',
  phoneNumber: '',
  fechaNacimiento: '',
}
