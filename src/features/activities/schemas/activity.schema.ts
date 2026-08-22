import * as yup from 'yup'

export interface ActivityLineFormValues {
  productId: string
  productName: string
  productImageUrl: string | null
  unitPrice: number
  /** Stock máximo disponible para esta línea al momento de agregarla/editarla (stock actual del producto + lo ya reservado por esta misma línea si se está editando). Snapshot tomado al agregar/abrir el formulario, no reactivo entre líneas. */
  maxQty: number
  initialQty: string
}

export interface ActivityFormValues {
  name: string
  zonaId: string
  products: ActivityLineFormValues[]
}

export const activityInitialValues: ActivityFormValues = {
  name: '',
  zonaId: '',
  products: [],
}

const activityLineSchema = yup.object({
  productId: yup.string().required(),
  productName: yup.string().required(),
  productImageUrl: yup.string().nullable(),
  unitPrice: yup.number().required(),
  maxQty: yup.number().required(),
  initialQty: yup
    .number()
    .typeError('')
    .integer()
    .required()
    .min(1)
    .test('max-stock', '', function (value) {
      const maxQty = this.parent.maxQty as number
      return value === undefined || value <= maxQty
    }),
})

export const activitySchema = yup.object({
  name: yup.string().trim().required(),
  zonaId: yup.string().required(),
  products: yup.array().of(activityLineSchema).min(1, 'Agregá al menos un producto para continuar.'),
})

export interface ActivityFillLineFormValues {
  productId: string
  productName: string
  productImageUrl: string | null
  unitPrice: number
  initialQty: number
  soldQty: string
}

export interface ActivityFillFormValues {
  revenue: string
  products: ActivityFillLineFormValues[]
}

const activityFillLineSchema = yup.object({
  productId: yup.string().required(),
  productName: yup.string().required(),
  productImageUrl: yup.string().nullable(),
  unitPrice: yup.number().required(),
  initialQty: yup.number().required(),
  soldQty: yup
    .number()
    .typeError('')
    .integer()
    .required()
    .min(0)
    .test('max-initial', '', function (value) {
      const initialQty = this.parent.initialQty as number
      return value === undefined || value <= initialQty
    }),
})

export const activityFillSchema = yup.object({
  revenue: yup.number().typeError('').required().moreThan(0),
  products: yup.array().of(activityFillLineSchema),
})
