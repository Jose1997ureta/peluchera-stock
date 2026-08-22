import * as yup from 'yup'

export const forgotPasswordEmailSchema = yup.object({
  correo: yup.string().email().required(),
})

export interface ForgotPasswordEmailFormValues {
  correo: string
}

export const forgotPasswordEmailInitialValues: ForgotPasswordEmailFormValues = {
  correo: '',
}

export const resetPasswordSchema = yup.object({
  password: yup.string().required().min(8),
  confirmarPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('password')], ''),
})

export interface ResetPasswordFormValues {
  password: string
  confirmarPassword: string
}

export const resetPasswordInitialValues: ResetPasswordFormValues = {
  password: '',
  confirmarPassword: '',
}
