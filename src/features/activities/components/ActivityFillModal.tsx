import { useFormik } from 'formik'
import { Search, X } from 'lucide-react'
import { type FocusEvent, useEffect, useMemo, useState } from 'react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Table, type TableColumn } from '@/shared/components/motion/table'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/motion/select'
import { toast } from '@/shared/lib/toast'
import type { Activity } from '@/shared/types/activity'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'
import { OpenCashCutForm } from '@/features/caja-chica/components/OpenCashCutForm'
import { useCurrentCashCut } from '@/features/caja-chica/hooks/useCurrentCashCut'
import { useOpenCashCut } from '@/features/caja-chica/hooks/useOpenCashCut'
import { useCloseActivity } from '../hooks/useCloseActivity'
import { useProductsByIds } from '../hooks/useProductsByIds'
import { useZonas } from '../hooks/useZonas'
import {
  activityFillSchema,
  type ActivityFillFormValues,
  type ActivityFillLineFormValues,
} from '../schemas/activity.schema'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'

const ROW_HEIGHT = 56
const HEADER_HEIGHT = 44
const MAX_VISIBLE_ROWS = 6

function buildFillLineValues(
  activity: Activity,
  productsById: Map<string, Product>,
): ActivityFillLineFormValues[] {
  return activity.products.map((line) => {
    const product = productsById.get(line.productId)
    return {
      productId: line.productId,
      productName: product?.name ?? line.productId,
      productImageUrl: product?.imageUrl ?? null,
      unitPrice: line.unitPrice,
      initialQty: line.initialQty,
      soldQty: String(line.soldQty),
    }
  })
}

export interface ActivityFillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
}

export function ActivityFillModal({
  open,
  onOpenChange,
  activity,
}: ActivityFillModalProps) {
  const closeActivity = useCloseActivity()
  const currentCashCut = useCurrentCashCut()
  const openCashCut = useOpenCashCut()
  const { data: zonas } = useZonas()
  const [search, setSearch] = useState('')
  const [openCajaPromptOpen, setOpenCajaPromptOpen] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

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
  const isReady = lineProductIds.length === 0 || !isLoadingLines

  const formik = useFormik<ActivityFillFormValues>({
    initialValues:
      activity && isReady
        ? {
            revenue: activity.revenue !== null ? String(activity.revenue) : '',
            products: buildFillLineValues(activity, productsById),
          }
        : { revenue: '', products: [] },
    validationSchema: activityFillSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      await submitClose(values)
      setSubmitting(false)
    },
  })

  async function submitClose(values: ActivityFillFormValues) {
    if (!activity) return

    if (!currentCashCut.data) {
      setOpenCajaPromptOpen(true)
      return
    }

    try {
      await closeActivity.mutateAsync({
        id: activity.id,
        revenue: Number(values.revenue),
        soldLines: values.products.map((line) => ({
          productId: line.productId,
          soldQty: Number(line.soldQty),
        })),
      })
      toast.success('Actividad cerrada.')
      onOpenChange(false)
    } catch {
      toast.error('No se pudo cerrar la actividad. Intentá de nuevo.')
    }
  }

  async function handleOpenCajaAndContinue(initialAmount: number) {
    try {
      await openCashCut.mutateAsync(initialAmount)
      setOpenCajaPromptOpen(false)
      await submitClose(formik.values)
    } catch {
      toast.error('No se pudo abrir la caja. Intentá de nuevo.')
    }
  }

  useEffect(() => {
    if (!open) {
      formik.resetForm()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear transient UI state when the modal closes, not an external sync
      setSearch('')
      setOpenCajaPromptOpen(false)
      setDiscardConfirmOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal closes, not on every formik identity change
  }, [open])

  function handleRequestClose() {
    if (formik.dirty) {
      setDiscardConfirmOpen(true)
    } else {
      onOpenChange(false)
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredProducts = normalizedSearch
    ? formik.values.products.filter((line) =>
        line.productName.toLowerCase().includes(normalizedSearch),
      )
    : formik.values.products

  const revenueTotal = Number(formik.values.revenue) || 0
  const soldQtyTotal = formik.values.products.reduce(
    (sum, line) => sum + (Number(line.soldQty) || 0),
    0,
  )
  const soldSubtotalTotal = formik.values.products.reduce(
    (sum, line) => sum + line.unitPrice * (Number(line.soldQty) || 0),
    0,
  )
  const earnedTotal = revenueTotal - soldSubtotalTotal

  function handleRevenueBlur(event: FocusEvent<HTMLInputElement>) {
    formik.handleBlur(event)
    const revenue = Number(formik.values.revenue)
    if (!formik.values.revenue || Number.isNaN(revenue) || revenue <= 0) {
      toast.error('Ingresá un monto de ingresos válido (mayor a 0).')
    }
  }

  function handleSoldQtyChange(index: number, value: string) {
    formik.setFieldValue(
      'products',
      formik.values.products.map((line, lineIndex) =>
        lineIndex === index ? { ...line, soldQty: value } : line,
      ),
    )
  }

  function handleSoldQtyBlur(line: ActivityFillLineFormValues) {
    const qty = Number(line.soldQty)
    if (!Number.isInteger(qty) || qty < 0) {
      toast.error(
        `"${line.productName}": ingresá una cantidad válida (mínimo 0).`,
      )
    } else if (qty > line.initialQty) {
      toast.error(
        `"${line.productName}": no puede superar lo reservado (máx. ${line.initialQty}).`,
      )
    }
  }

  const lineErrors = Array.isArray(formik.errors.products)
    ? formik.errors.products
    : []

  const columns: TableColumn<ActivityFillLineFormValues>[] = [
    {
      key: 'rowNumber',
      header: '#',
      width: '56px',
      cell: (row) => {
        const index = formik.values.products.findIndex(
          (line) => line.productId === row.productId,
        )
        return (
          <span className="tabular-nums text-muted-foreground">
            {index + 1}
          </span>
        )
      },
    },
    {
      key: 'productName',
      header: 'Producto',
      cell: (row) => (
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
      ),
    },
    {
      key: 'initialQty',
      header: 'Reservado',
      align: 'right',
      width: '96px',
      cell: (row) => <span className="tabular-nums">{row.initialQty}</span>,
    },
    {
      key: 'soldQty',
      header: 'Cantidad real',
      align: 'right',
      width: '120px',
      cell: (row) => {
        const index = formik.values.products.findIndex(
          (line) => line.productId === row.productId,
        )
        const lineError = lineErrors[index]
        const qtyError =
          typeof lineError === 'object' && lineError !== null
            ? (lineError as { soldQty?: string }).soldQty
            : undefined
        return (
          <>
            <Label htmlFor={`sold-${row.productId}`} className="sr-only">
              Cantidad real
            </Label>
            <Input
              id={`sold-${row.productId}`}
              type="number"
              step="1"
              min="0"
              max={row.initialQty}
              value={row.soldQty}
              onChange={(event) =>
                handleSoldQtyChange(index, event.target.value)
              }
              onBlur={() => handleSoldQtyBlur(row)}
              aria-invalid={qtyError !== undefined}
              className="w-16 px-1.5"
            />
          </>
        )
      },
    },
    {
      key: 'subtotal',
      header: 'Subtotal real',
      align: 'right',
      width: '120px',
      cell: (row) => (
        <span className="tabular-nums">
          {formatCurrency(row.unitPrice * (Number(row.soldQty) || 0))}
        </span>
      ),
    },
  ]

  const rowCount = filteredProducts.length
  const tableHeight =
    Math.min(Math.max(rowCount, 1), MAX_VISIBLE_ROWS) * ROW_HEIGHT +
    HEADER_HEIGHT

  return (
    <CenterMorphModal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleRequestClose()
        } else {
          onOpenChange(next)
        }
      }}
    >
      <CenterMorphModalContent
        ariaLabel="Rellenar actividad"
        dismissible={!formik.isSubmitting}
        autoFocus={false}
        className="max-w-5xl xl:max-w-6xl"
      >
        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="flex max-h-[85vh] flex-col p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Rellenar actividad
          </h2>

          <div className="-mx-1 mt-4 flex min-h-0 flex-1 flex-col gap-6 p-1 md:grid md:grid-cols-7 md:gap-8">
            <div className="flex flex-col gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fill-name">Nombre</Label>
                <Input id="fill-name" value={activity?.name ?? ''} disabled />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Zona</Label>
                <Select value={activity ? String(activity.zonaId) : undefined} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {(zonas ?? []).map((zone) => (
                      <SelectItem key={zone.id} value={String(zone.id)}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fill-revenue">Ingresos</Label>
                <Input
                  id="fill-revenue"
                  name="revenue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formik.values.revenue}
                  onChange={formik.handleChange}
                  onBlur={handleRevenueBlur}
                  aria-invalid={Boolean(
                    formik.touched.revenue && formik.errors.revenue,
                  )}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 md:col-span-5 md:flex-none">
              <Label>Productos</Label>

              {formik.values.products.length > 0 ? (
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
              ) : filteredProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Ningún producto coincide con la búsqueda.
                </p>
              ) : (
                <>
                  {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {filteredProducts.map((row) => {
                      const index = formik.values.products.findIndex(
                        (line) => line.productId === row.productId,
                      )
                      const lineError = lineErrors[index]
                      const qtyError =
                        typeof lineError === 'object' && lineError !== null
                          ? (lineError as { soldQty?: string }).soldQty
                          : undefined
                      return (
                        <Card key={row.productId}>
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
                                Reservado
                              </span>
                              <span className="text-right tabular-nums">
                                {row.initialQty}
                              </span>

                              <Label
                                htmlFor={`sold-mobile-${row.productId}`}
                                className="text-muted-foreground"
                              >
                                Cantidad real
                              </Label>
                              <Input
                                id={`sold-mobile-${row.productId}`}
                                type="number"
                                step="1"
                                min="0"
                                max={row.initialQty}
                                value={row.soldQty}
                                onChange={(event) =>
                                  handleSoldQtyChange(index, event.target.value)
                                }
                                onBlur={() => handleSoldQtyBlur(row)}
                                aria-invalid={qtyError !== undefined}
                                className="ml-auto w-20 px-1.5 text-right"
                              />

                              <span className="text-muted-foreground">
                                Subtotal real
                              </span>
                              <span className="text-right tabular-nums">
                                {formatCurrency(
                                  row.unitPrice * (Number(row.soldQty) || 0),
                                )}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="hidden md:block">
                    <Table
                      data={filteredProducts}
                      columns={columns}
                      getRowId={(row) => row.productId}
                      rowHeight={ROW_HEIGHT}
                      height={tableHeight}
                      className="rounded-xl"
                    />
                  </div>
                </>
              )}

              {formik.values.products.length > 0 ? (
                <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Cantidad vendida
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {soldQtyTotal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Subtotal real
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(soldSubtotalTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Ingreso
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(revenueTotal)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-base font-semibold text-foreground">
                      Monto ganado
                    </span>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        earnedTotal >= 0 ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {formatCurrency(earnedTotal)}
                    </span>
                  </div>
                </div>
              ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={formik.isSubmitting}
              onClick={handleRequestClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={formik.isSubmitting || isLoadingLines}
            >
              Cerrar actividad
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>

      <CenterMorphModal open={openCajaPromptOpen} onOpenChange={setOpenCajaPromptOpen}>
        <CenterMorphModalContent
          ariaLabel="Abrir caja"
          dismissible={!openCashCut.isPending}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Abrí la caja para continuar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Para cerrar una actividad hace falta una caja abierta. Los datos que ya cargaste
              no se pierden: al abrir la caja, la actividad se cierra sola a continuación.
            </p>

            <div className="mt-4">
              <OpenCashCutForm
                idPrefix="open-caja-fill"
                isPending={openCashCut.isPending}
                onSubmit={handleOpenCajaAndContinue}
              />
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>

      <CenterMorphModal open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <CenterMorphModalContent ariaLabel="Descartar cambios">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Tenés cambios sin guardar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Seguro que querés cerrar? Los cambios que hiciste se van a perder.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
                Seguir editando
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDiscardConfirmOpen(false)
                  onOpenChange(false)
                }}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </CenterMorphModal>
  )
}
