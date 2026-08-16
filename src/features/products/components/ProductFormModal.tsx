import { useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { Product } from '@/shared/types/product'
import { useCreateProduct } from '../hooks/useCreateProduct'
import { useUpdateProduct } from '../hooks/useUpdateProduct'
import {
  productInitialValues,
  productSchema,
  type ProductFormValues,
} from '../schemas/product.schema'
import { ProductImageDropzone } from './ProductImageDropzone'
import { toast } from '@/shared/lib/toast'

function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: String(product.price),
    stock: String(product.stock),
    image: null,
    existingImageUrl: product.imageUrl,
  }
}

export interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function ProductFormModal({ open, onOpenChange, product }: ProductFormModalProps) {
  const isEditing = product !== null
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const formik = useFormik<ProductFormValues>({
    initialValues: product ? productToFormValues(product) : productInitialValues,
    validationSchema: productSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const input = {
        name: values.name.trim(),
        price: Number(values.price),
        stock: Number(values.stock),
        image: values.image,
        existingImageUrl: values.existingImageUrl,
      }

      const mutation = isEditing
        ? updateProduct.mutateAsync({ id: product.id, input })
        : createProduct.mutateAsync(input)

      try {
        await mutation
        toast.success(isEditing ? 'Producto actualizado.' : 'Producto creado.')
        resetForm()
        onOpenChange(false)
      } catch {
        toast.error('No se pudo guardar el producto. Intentá de nuevo.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  /* eslint-disable react-hooks/set-state-in-effect -- createObjectURL/revokeObjectURL is an external-resource lifecycle that needs the effect's cleanup */
  useEffect(() => {
    if (!formik.values.image) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(formik.values.image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [formik.values.image])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) formik.resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal closes, not on every formik identity change
  }, [open])

  const displayedImageUrl = useMemo(
    () => previewUrl ?? formik.values.existingImageUrl,
    [previewUrl, formik.values.existingImageUrl],
  )

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={isEditing ? 'Editar producto' : 'Crear producto'}
        dismissible={!formik.isSubmitting}
      >
        <form onSubmit={formik.handleSubmit} noValidate className="p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Editar producto' : 'Crear producto'}
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">Precio (S/)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(formik.touched.price && formik.errors.price)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  step="1"
                  min="1"
                  value={formik.values.stock}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(formik.touched.stock && formik.errors.stock)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Imagen</Label>
              <ProductImageDropzone
                previewUrl={displayedImageUrl}
                onFileSelect={(file) => formik.setFieldValue('image', file)}
                onClear={() => {
                  formik.setFieldValue('image', null)
                  formik.setFieldValue('existingImageUrl', null)
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={formik.isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              {isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
