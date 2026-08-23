import { Search, X } from 'lucide-react'
import { type KeyboardEvent, useMemo, useState } from 'react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Table, type TableColumn } from '@/shared/components/motion/table'
import { AnimatedBadge } from '@/shared/components/motion/animated-badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import type { Activity } from '@/shared/types/activity'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { useProductsByIds } from '../hooks/useProductsByIds'
import { useZonas } from '../hooks/useZonas'
import { ActivityProductDetailModal } from './ActivityProductDetailModal'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'

const ROW_HEIGHT = 56
const HEADER_HEIGHT = 44
const MAX_VISIBLE_ROWS = 6

interface ActivityViewLine {
  productId: string
  productName: string
  productImageUrl: string | null
  unitPrice: number
  initialQty: number
  soldQty: number
}

function buildViewLines(
  activity: Activity,
  productsById: Map<string, Product>,
): ActivityViewLine[] {
  return activity.products.map((line) => {
    const product = productsById.get(line.productId)
    return {
      productId: line.productId,
      productName: product?.name ?? line.productId,
      productImageUrl: product?.imageUrl ?? null,
      unitPrice: line.unitPrice,
      initialQty: line.initialQty,
      soldQty: line.soldQty,
    }
  })
}

/** Envuelve el contenido de una celda para que toda la fila sea clickeable, sin depender de que la tabla compartida soporte `onRowClick`. */
function ClickableCell({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex size-full cursor-pointer items-center"
    >
      {children}
    </div>
  )
}

export interface ActivityViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
}

export function ActivityViewModal({
  open,
  onOpenChange,
  activity,
}: ActivityViewModalProps) {
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  )

  const { data: zonas } = useZonas()
  const zoneNameById = useMemo(
    () => new Map((zonas ?? []).map((zone) => [zone.id, zone.name])),
    [zonas],
  )

  const lineProductIds = useMemo(
    () => activity?.products.map((line) => line.productId) ?? [],
    [activity],
  )
  const { data: lineProducts, isLoading: isLoadingLines } =
    useProductsByIds(lineProductIds)
  const productsById = useMemo(
    () => new Map((lineProducts ?? []).map((product) => [product.id, product])),
    [lineProducts],
  )

  const lines = useMemo(
    () => (activity ? buildViewLines(activity, productsById) : []),
    [activity, productsById],
  )

  const normalizedSearch = search.trim().toLowerCase()
  const filteredLines = normalizedSearch
    ? lines.filter((line) =>
        line.productName.toLowerCase().includes(normalizedSearch),
      )
    : lines

  const isClosed = activity?.status === 'closed'
  const totalQty = lines.reduce((sum, line) => sum + line.initialQty, 0)
  const soldQtyTotal = lines.reduce((sum, line) => sum + line.soldQty, 0)
  const estimatedTotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.initialQty,
    0,
  )
  const investedTotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.soldQty,
    0,
  )
  const revenueTotal = activity?.revenue ?? 0
  const realTotal = revenueTotal - investedTotal

  const selectedProduct = selectedProductId
    ? productsById.get(selectedProductId) ?? null
    : null

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setSearch('')
    onOpenChange(nextOpen)
  }

  const columns: TableColumn<ActivityViewLine>[] = [
    {
      key: 'rowNumber',
      header: '#',
      width: '56px',
      cell: (row) => {
        const index = lines.findIndex((line) => line.productId === row.productId)
        return (
          <ClickableCell onClick={() => setSelectedProductId(row.productId)}>
            <span className="tabular-nums text-muted-foreground">
              {index + 1}
            </span>
          </ClickableCell>
        )
      },
    },
    {
      key: 'productName',
      header: 'Producto',
      cell: (row) => (
        <ClickableCell onClick={() => setSelectedProductId(row.productId)}>
          <div className="flex items-center gap-2">
            <ActivityProductThumbnail
              imageUrl={row.productImageUrl}
              name={row.productName}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">
                {row.productName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {formatCurrency(row.unitPrice)} c/u
              </span>
            </div>
          </div>
        </ClickableCell>
      ),
    },
    {
      key: 'initialQty',
      header: isClosed ? 'Reservado' : 'Cantidad',
      align: 'right',
      width: '96px',
      cell: (row) => (
        <ClickableCell onClick={() => setSelectedProductId(row.productId)}>
          <span className="ml-auto tabular-nums">{row.initialQty}</span>
        </ClickableCell>
      ),
    },
    ...(isClosed
      ? [
          {
            key: 'soldQty',
            header: 'Vendido',
            align: 'right' as const,
            width: '88px',
            cell: (row: ActivityViewLine) => (
              <ClickableCell onClick={() => setSelectedProductId(row.productId)}>
                <span className="ml-auto tabular-nums">{row.soldQty}</span>
              </ClickableCell>
            ),
          },
        ]
      : []),
    {
      key: 'subtotal',
      header: 'Subtotal venta',
      align: 'right',
      width: '120px',
      cell: (row) => (
        <ClickableCell onClick={() => setSelectedProductId(row.productId)}>
          <span className="ml-auto tabular-nums">
            {formatCurrency(row.unitPrice * row.initialQty)}
          </span>
        </ClickableCell>
      ),
    },
  ]

  const rowCount = filteredLines.length
  const tableHeight =
    Math.min(Math.max(rowCount, 1), MAX_VISIBLE_ROWS) * ROW_HEIGHT +
    HEADER_HEIGHT

  return (
    <>
      <CenterMorphModal open={open} onOpenChange={handleOpenChange}>
        <CenterMorphModalContent
          ariaLabel="Ver actividad"
          autoFocus={false}
          className="max-w-2xl"
        >
          <div className="flex max-h-[85vh] flex-col p-6">
            {activity ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-lg font-semibold text-foreground">
                    {activity.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AnimatedBadge
                      size="sm"
                      status={isClosed ? 'success' : 'info'}
                      showIcon={false}
                    >
                      {isClosed ? 'Cerrada' : 'Abierta'}
                    </AnimatedBadge>
                    <AnimatedBadge size="sm" status="neutral" showIcon={false}>
                      {zoneNameById.get(activity.zonaId) ?? '—'}
                    </AnimatedBadge>
                    <AnimatedBadge size="sm" status="neutral" showIcon={false}>
                      Creada {formatDate(activity.createdAt)}
                    </AnimatedBadge>
                    {isClosed && activity.closedAt ? (
                      <AnimatedBadge size="sm" status="neutral" showIcon={false}>
                        Cerrada {formatDate(activity.closedAt)}
                      </AnimatedBadge>
                    ) : null}
                  </div>
                </div>

                <div className="-mx-1 mt-4 flex min-h-0 flex-1 flex-col gap-2 p-1">
                  {lines.length > 0 ? (
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar producto..."
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
                  ) : null}

                  <div className="-mx-1 min-h-0 flex-1 overflow-y-auto p-1 md:mx-0 md:flex-none md:overflow-visible md:p-0">
                  {isLoadingLines ? (
                    <p className="text-sm text-muted-foreground">
                      Cargando productos de la actividad...
                    </p>
                  ) : lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Esta actividad no tiene productos asignados.
                    </p>
                  ) : filteredLines.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      Ningún producto coincide con la búsqueda.
                    </p>
                  ) : (
                    <>
                      {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
                      <div className="flex flex-col gap-3 md:hidden">
                        {filteredLines.map((row) => (
                          <Card
                            key={row.productId}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedProductId(row.productId)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setSelectedProductId(row.productId)
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <CardContent className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <ActivityProductThumbnail
                                  imageUrl={row.productImageUrl}
                                  name={row.productName}
                                />
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium text-foreground">
                                    {row.productName}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {formatCurrency(row.unitPrice)} c/u
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 items-center gap-x-3 gap-y-2 text-sm">
                                <span className="text-muted-foreground">
                                  {isClosed ? 'Reservado' : 'Cantidad'}
                                </span>
                                <span className="text-right tabular-nums">
                                  {row.initialQty}
                                </span>

                                {isClosed ? (
                                  <>
                                    <span className="text-muted-foreground">
                                      Vendido
                                    </span>
                                    <span className="text-right tabular-nums">
                                      {row.soldQty}
                                    </span>
                                  </>
                                ) : null}

                                <span className="text-muted-foreground">
                                  Subtotal venta
                                </span>
                                <span className="text-right tabular-nums">
                                  {formatCurrency(row.unitPrice * row.initialQty)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="hidden md:block">
                        <Table
                          data={filteredLines}
                          columns={columns}
                          getRowId={(row) => row.productId}
                          rowHeight={ROW_HEIGHT}
                          height={tableHeight}
                          className="rounded-xl"
                        />
                      </div>
                    </>
                  )}

                  {lines.length > 0 ? (
                    <>
                      {isClosed ? (
                        <div className="mt-3 flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              Cantidad de productos
                            </span>
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {totalQty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              Cantidad de productos vendidos
                            </span>
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {soldQtyTotal}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div
                        className={`flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5 ${
                          isClosed ? 'mt-2' : 'mt-3'
                        }`}
                      >
                        {isClosed ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                Ingreso
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {formatCurrency(revenueTotal)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                Monto de la inversión
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {formatCurrency(investedTotal)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                              <span className="text-base font-semibold text-foreground">
                                Monto real
                              </span>
                              <span
                                className={`text-lg font-bold tabular-nums ${
                                  realTotal >= 0
                                    ? 'text-emerald-600'
                                    : 'text-destructive'
                                }`}
                              >
                                {formatCurrency(realTotal)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                Cantidad
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {totalQty}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                Monto estimado de venta
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {formatCurrency(estimatedTotal)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : null}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      <ActivityProductDetailModal
        product={selectedProduct}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedProductId(null)
        }}
      />
    </>
  )
}
