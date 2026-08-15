import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/motion/popover'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'
import { useActiveProductsForPicker } from '../hooks/useActiveProductsForPicker'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'

export interface ProductPickerProps {
  excludeProductIds: string[]
  onSelect: (product: Product) => void
}

export function ProductPicker({ excludeProductIds, onSelect }: ProductPickerProps) {
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
  const results = (data ?? []).filter((product) => !excludeProductIds.includes(product.id))

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen} align="start" sideOffset={6}>
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
            className="pl-8"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-none p-0"
        style={triggerWidth ? { width: triggerWidth } : undefined}
      >
        <div className="max-h-64 overflow-y-auto p-1.5">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                onSelect(product)
                setSearch('')
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
            >
              <ActivityProductThumbnail imageUrl={product.imageUrl} name={product.name} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(product.price)} · Stock disponible: {product.stock}
                </span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
