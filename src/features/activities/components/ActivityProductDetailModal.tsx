import { ImageOff } from 'lucide-react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Button } from '@/shared/components/ui/button'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'

export interface ActivityProductDetailModalProps {
  product: Product | null
  onOpenChange: (open: boolean) => void
}

export function ActivityProductDetailModal({
  product,
  onOpenChange,
}: ActivityProductDetailModalProps) {
  return (
    <CenterMorphModal open={product !== null} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={product?.name ?? 'Producto'}>
        {product ? (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex h-72 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="size-full object-contain"
                />
              ) : (
                <ImageOff className="size-8 text-muted-foreground" aria-hidden="true" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-foreground">
              {product.name}
            </h2>

            <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Precio</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(product.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Stock actual
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {product.stock}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
