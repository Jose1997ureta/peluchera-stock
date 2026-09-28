import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/motion/popover'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'
import { useActiveProductsForPicker } from '../hooks/useActiveProductsForPicker'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'

export interface ProductPickerProps {
  /** Productos que ya están en la lista: se siguen mostrando y al elegirlos se suma 1 a su cantidad. */
  selectedProductIds: string[]
  onSelect: (product: Product) => void
}

export function ProductPicker({ selectedProductIds, onSelect }: ProductPickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 250)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [triggerWidth, setTriggerWidth] = useState<number>()

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setTriggerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data } = useActiveProductsForPicker(debouncedSearch)
  const results = data ?? []

  return (
    <Popover
      open={open && results.length > 0}
      onOpenChange={setOpen}
      align="start"
      sideOffset={6}
      className="w-full"
    >
      <PopoverTrigger>
        <div ref={triggerRef} className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar producto por nombre..."
            className="pl-8 pr-8"
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-none p-0"
        style={triggerWidth ? { width: triggerWidth } : undefined}
      >
        <div className="max-h-64 overflow-y-auto p-1.5">
          {results.map((product) => {
            const isSelected = selectedProductIds.includes(product.id)
            const isOutOfStock = product.stock <= 0
            // Sin stock se muestra igual, pero solo se puede elegir si ya está en la lista
            // (en edición su máximo incluye lo ya reservado por esa línea).
            const isDisabled = isOutOfStock && !isSelected
            return (
              <button
                key={product.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onSelect(product)
                  setSearch('')
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
              >
                <ActivityProductThumbnail imageUrl={product.imageUrl} name={product.name} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-foreground">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(product.price)} ·{' '}
                    {isOutOfStock ? (
                      <span className="text-destructive">Sin stock</span>
                    ) : (
                      `Stock disponible: ${product.stock}`
                    )}
                  </span>
                </span>
                {isSelected ? (
                  <span className="shrink-0 text-xs text-muted-foreground">En la lista · +1</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
