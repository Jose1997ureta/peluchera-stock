import * as yup from 'yup'

export const loginSchema = yup.object({
  correo: yup.string().email().required(),
  password: yup.string().required(),
})

export interface LoginFormValues {
  correo: string
  password: string
}

export const loginInitialValues: LoginFormValues = {
  correo: '',
  password: '',
}
