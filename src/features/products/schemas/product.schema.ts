import * as yup from 'yup'

export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ProductFormValues {
  name: string
  price: string
  stock: string
  image: File | null
  existingImageUrl: string | null
}

export const productInitialValues: ProductFormValues = {
  name: '',
  price: '',
  stock: '',
  image: null,
  existingImageUrl: null,
}

export const productSchema = yup.object({
  name: yup.string().trim().required(),
  price: yup.number().typeError('').required().moreThan(0),
  stock: yup.number().typeError('').integer().required().min(1),
  image: yup
    .mixed<File>()
    .nullable()
    .test('fileSize', '', (file) => !file || file.size <= PRODUCT_IMAGE_MAX_SIZE_BYTES)
    .test('fileType', '', (file) => !file || PRODUCT_IMAGE_ACCEPTED_TYPES.includes(file.type)),
  existingImageUrl: yup.string().nullable(),
})
