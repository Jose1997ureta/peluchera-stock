import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/motion/tabs'
import { toast } from '@/shared/lib/toast'
import type { Product } from '@/shared/types/product'
import { useBulkDeleteProducts } from '../hooks/useBulkDeleteProducts'
import { useBulkSetProductsActive } from '../hooks/useBulkSetProductsActive'
import { useDeleteProduct } from '../hooks/useDeleteProduct'
import { useSetProductActive } from '../hooks/useSetProductActive'
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog'
import { ProductFormModal } from './ProductFormModal'
import { ProductsTabPanel } from './ProductsTabPanel'

type ConfirmAction = {
  type: 'activate' | 'deactivate' | 'delete'
  products: Product[]
}

const CONFIRM_COPY: Record<
  ConfirmAction['type'],
  { title: string; verb: string; successSingular: string; successPlural: string }
> = {
  activate: {
    title: 'Activar producto',
    verb: 'Activar',
    successSingular: 'Producto activado.',
    successPlural: 'productos activados.',
  },
  deactivate: {
    title: 'Desactivar producto',
    verb: 'Desactivar',
    successSingular: 'Producto desactivado.',
    successPlural: 'productos desactivados.',
  },
  delete: {
    title: 'Eliminar producto',
    verb: 'Eliminar',
    successSingular: 'Producto eliminado.',
    successPlural: 'productos eliminados.',
  },
}

export default function ProductsPage() {
  const [formModal, setFormModal] = useState<{ product: Product | null } | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const setProductActive = useSetProductActive()
  const bulkSetProductsActive = useBulkSetProductsActive()
  const deleteProduct = useDeleteProduct()
  const bulkDeleteProducts = useBulkDeleteProducts()

  const isConfirmPending =
    setProductActive.isPending ||
    bulkSetProductsActive.isPending ||
    deleteProduct.isPending ||
    bulkDeleteProducts.isPending

  function handleRequestConfirm(type: ConfirmAction['type'], products: Product[]) {
    setConfirmAction({ type, products })
  }

  async function handleConfirm() {
    if (!confirmAction) return
    const { type, products } = confirmAction
    const isBulk = products.length > 1
    const copy = CONFIRM_COPY[type]

    try {
      if (type === 'delete') {
        if (isBulk) {
          await bulkDeleteProducts.mutateAsync(products.map((product) => product.id))
        } else {
          await deleteProduct.mutateAsync(products[0].id)
        }
      } else {
        const isActive = type === 'activate'
        if (isBulk) {
          await bulkSetProductsActive.mutateAsync({
            ids: products.map((product) => product.id),
            isActive,
          })
        } else {
          await setProductActive.mutateAsync({ id: products[0].id, isActive })
        }
      }

      toast.success(isBulk ? `${products.length} ${copy.successPlural}` : copy.successSingular)
      setConfirmAction(null)
    } catch {
      toast.error('No se pudo completar la acción. Intentá de nuevo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Tabs defaultValue="active" variant="pill">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="inactive">Desactivados</TabsTrigger>
            </TabsList>

            <Button onClick={() => setFormModal({ product: null })}>
              <Plus className="size-4" />
              Crear producto
            </Button>
          </div>

          <TabsContent value="active">
            <ProductsTabPanel
              isActiveTab
              onEdit={(product) => setFormModal({ product })}
              onRequestConfirm={handleRequestConfirm}
              onCreateProduct={() => setFormModal({ product: null })}
            />
          </TabsContent>
          <TabsContent value="inactive">
            <ProductsTabPanel
              isActiveTab={false}
              onEdit={(product) => setFormModal({ product })}
              onRequestConfirm={handleRequestConfirm}
              onCreateProduct={() => setFormModal({ product: null })}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ProductFormModal
        open={formModal !== null}
        onOpenChange={(open) => {
          if (!open) setFormModal(null)
        }}
        product={formModal?.product ?? null}
      />

      {confirmAction ? (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null)
          }}
          title={CONFIRM_COPY[confirmAction.type].title}
          description={
            confirmAction.products.length > 1
              ? `¿Confirmás ${CONFIRM_COPY[confirmAction.type].verb.toLowerCase()} ${confirmAction.products.length} productos?`
              : `¿Confirmás ${CONFIRM_COPY[confirmAction.type].verb.toLowerCase()} "${confirmAction.products[0].name}"?`
          }
          confirmLabel={CONFIRM_COPY[confirmAction.type].verb}
          isDestructive={confirmAction.type === 'delete'}
          isPending={isConfirmPending}
          onConfirm={handleConfirm}
        />
      ) : null}
    </div>
  )
}
