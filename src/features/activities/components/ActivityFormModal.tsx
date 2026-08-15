import { useFormik } from 'formik'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
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
import { useCreateActivity } from '../hooks/useCreateActivity'
import { useProductsByIds } from '../hooks/useProductsByIds'
import { useUpdateActivity } from '../hooks/useUpdateActivity'
import { useZonas } from '../hooks/useZonas'
import {
  activityInitialValues,
  activitySchema,
  type ActivityFormValues,
  type ActivityLineFormValues,
} from '../schemas/activity.schema'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'
import { ProductPicker } from './ProductPicker'

const ROW_HEIGHT = 56
const HEADER_HEIGHT = 44
const MAX_VISIBLE_ROWS = 6

export type ActivityFormModalMode = 'create' | 'edit' | 'view'

function buildLineValues(
  activity: Activity,
  productsById: Map<string, Product>,
): ActivityLineFormValues[] {
  return activity.products.map((line) => {
    const product = productsById.get(line.productId)
    return {
      productId: line.productId,
      productName: product?.name ?? line.productId,
      productImageUrl: product?.imageUrl ?? null,
      unitPrice: line.unitPrice,
      // El stock actual ya excluye la reserva de esta misma línea, así que se le suma de vuelta
      // para saber cuánto se puede subir la cantidad sin exceder el stock real disponible.
      maxQty: (product?.stock ?? 0) + line.initialQty,
      initialQty: String(line.initialQty),
      soldQty: line.soldQty,
    }
  })
}

export interface ActivityFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  mode: ActivityFormModalMode
}

export function ActivityFormModal({
  open,
  onOpenChange,
  activity,
  mode,
}: ActivityFormModalProps) {
  const isViewOnly = mode === 'view'
  const isEditing = mode === 'edit'
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const { data: zonas } = useZonas()

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
  const isReady =
    mode === 'create' || lineProductIds.length === 0 || !isLoadingLines

  const formik = useFormik<ActivityFormValues>({
    initialValues:
      activity && isReady
        ? {
            name: activity.name,
            zonaId: String(activity.zonaId),
            products: buildLineValues(activity, productsById),
          }
        : activityInitialValues,
    validationSchema: activitySchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const input = {
        name: values.name.trim(),
        zonaId: Number(values.zonaId),
        products: values.products.map((line) => ({
          productId: line.productId,
          unitPrice: line.unitPrice,
          initialQty: Number(line.initialQty),
        })),
      }

      const mutation =
        isEditing && activity
          ? updateActivity.mutateAsync({ id: activity.id, input })
          : createActivity.mutateAsync(input)

      try {
        await mutation
        toast.success(
          isEditing ? 'Actividad actualizada.' : 'Actividad creada.',
        )
        resetForm()
        onOpenChange(false)
      } catch {
        toast.error('No se pudo guardar la actividad. Intentá de nuevo.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!open) formik.resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal closes, not on every formik identity change
  }, [open])

  const selectedProductIds = formik.values.products.map(
    (line) => line.productId,
  )
  const estimatedTotal = formik.values.products.reduce(
    (sum, line) => sum + line.unitPrice * (Number(line.initialQty) || 0),
    0,
  )
  const investedTotal = formik.values.products.reduce(
    (sum, line) => sum + line.unitPrice * (line.soldQty ?? 0),
    0,
  )
  const revenueTotal = activity?.revenue ?? 0
  const realTotal = revenueTotal - investedTotal

  function handleSelectProduct(product: Product) {
    const next: ActivityLineFormValues = {
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl,
      unitPrice: product.price,
      maxQty: product.stock,
      initialQty: '1',
    }
    formik.setFieldValue('products', [...formik.values.products, next])
  }

  function handleRemoveLine(index: number) {
    formik.setFieldValue(
      'products',
      formik.values.products.filter((_, lineIndex) => lineIndex !== index),
    )
  }

  function handleQtyChange(index: number, value: string) {
    formik.setFieldValue(
      'products',
      formik.values.products.map((line, lineIndex) =>
        lineIndex === index ? { ...line, initialQty: value } : line,
      ),
    )
  }

  function handleQtyBlur(line: ActivityLineFormValues) {
    const qty = Number(line.initialQty)
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error(
        `"${line.productName}": ingresá una cantidad válida (mínimo 1).`,
      )
    } else if (qty > line.maxQty) {
      toast.error(
        `"${line.productName}": la cantidad supera el stock disponible (máx. ${line.maxQty}).`,
      )
    }
  }

  const lineErrors = Array.isArray(formik.errors.products)
    ? formik.errors.products
    : []
  const productsListError =
    typeof formik.errors.products === 'string'
      ? formik.errors.products
      : undefined
  const showProductsListError =
    formik.submitCount > 0 && Boolean(productsListError)

  function buildColumns(): TableColumn<ActivityLineFormValues>[] {
    const cols: TableColumn<ActivityLineFormValues>[] = [
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
                {isViewOnly ? '' : ` · Máx: ${row.maxQty}`}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'initialQty',
        header: isViewOnly ? 'Reservado' : 'Cantidad',
        align: 'right',
        width: isViewOnly ? '96px' : '110px',
        cell: (row) => {
          if (isViewOnly) {
            return <span className="tabular-nums">{row.initialQty}</span>
          }
          const index = formik.values.products.findIndex(
            (line) => line.productId === row.productId,
          )
          const lineError = lineErrors[index]
          const qtyError =
            typeof lineError === 'object' && lineError !== null
              ? (lineError as { initialQty?: string }).initialQty
              : undefined
          return (
            <>
              <Label htmlFor={`qty-${row.productId}`} className="sr-only">
                Cantidad
              </Label>
              <Input
                id={`qty-${row.productId}`}
                type="number"
                step="1"
                min="1"
                max={row.maxQty}
                value={row.initialQty}
                onChange={(event) => handleQtyChange(index, event.target.value)}
                onBlur={() => handleQtyBlur(row)}
                aria-invalid={qtyError !== undefined}
                className="w-14 px-1.5"
              />
            </>
          )
        },
      },
    ]

    if (isViewOnly) {
      cols.push({
        key: 'soldQty',
        header: 'Vendido',
        align: 'right',
        width: '88px',
        cell: (row) => <span className="tabular-nums">{row.soldQty ?? 0}</span>,
      })
    }

    cols.push({
      key: 'subtotal',
      header: 'Subtotal venta',
      align: 'right',
      width: isViewOnly ? '110px' : '120px',
      cell: (row) => (
        <span className="tabular-nums">
          {formatCurrency(row.unitPrice * (Number(row.initialQty) || 0))}
        </span>
      ),
    })

    if (!isViewOnly) {
      cols.push({
        key: 'actions',
        header: 'Acción',
        align: 'right',
        width: '96px',
        cell: (row) => {
          const index = formik.values.products.findIndex(
            (line) => line.productId === row.productId,
          )
          return (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Quitar producto"
              onClick={() => handleRemoveLine(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          )
        },
      })
    }

    return cols
  }

  const columns = buildColumns()
  const rowCount = formik.values.products.length
  const tableHeight =
    Math.min(Math.max(rowCount, 1), MAX_VISIBLE_ROWS) * ROW_HEIGHT +
    HEADER_HEIGHT

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={
          mode === 'create'
            ? 'Crear actividad'
            : mode === 'edit'
              ? 'Editar actividad'
              : 'Ver actividad'
        }
        dismissible={!formik.isSubmitting}
        className="max-w-5xl xl:max-w-6xl"
      >
        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="flex max-h-[85vh] flex-col p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">
            {mode === 'create'
              ? 'Crear actividad'
              : mode === 'edit'
                ? 'Editar actividad'
                : 'Ver actividad'}
          </h2>

          <div className="-mx-1 mt-4 grid grid-cols-1 gap-6 overflow-y-auto p-1 md:grid-cols-7 md:gap-8">
            <div className="flex flex-col gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isViewOnly}
                  aria-invalid={Boolean(
                    formik.touched.name && formik.errors.name,
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Zona</Label>
                <Select
                  value={formik.values.zonaId}
                  onValueChange={(value) => formik.setFieldValue('zonaId', value)}
                  disabled={isViewOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí una zona" />
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
            </div>

            <div className="flex flex-col gap-2 md:col-span-5">
              <Label>Productos</Label>

              {isViewOnly ? null : (
                <ProductPicker
                  excludeProductIds={selectedProductIds}
                  onSelect={handleSelectProduct}
                />
              )}

              {isLoadingLines ? (
                <p className="text-sm text-muted-foreground">
                  Cargando productos de la actividad...
                </p>
              ) : formik.values.products.length === 0 ? (
                <p
                  className={
                    showProductsListError
                      ? 'text-sm text-destructive'
                      : 'text-sm text-muted-foreground'
                  }
                >
                  {showProductsListError
                    ? productsListError
                    : 'Sin productos agregados todavía. Buscá uno arriba para agregarlo.'}
                </p>
              ) : (
                <>
                  {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {formik.values.products.map((row) => {
                      const index = formik.values.products.findIndex(
                        (line) => line.productId === row.productId,
                      )
                      const lineError = lineErrors[index]
                      const qtyError =
                        typeof lineError === 'object' && lineError !== null
                          ? (lineError as { initialQty?: string }).initialQty
                          : undefined
                      return (
                        <Card key={row.productId}>
                          <CardContent className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <ActivityProductThumbnail
                                  imageUrl={row.productImageUrl}
                                  name={row.productName}
                                />
                                <div className="flex min-w-0 flex-col">
                                  <span className="break-words font-medium text-foreground">
                                    {row.productName}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {formatCurrency(row.unitPrice)} c/u
                                    {isViewOnly ? '' : ` · Máx: ${row.maxQty}`}
                                  </span>
                                </div>
                              </div>
                              {isViewOnly ? null : (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Quitar producto"
                                  onClick={() => handleRemoveLine(index)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 items-center gap-x-3 gap-y-2 text-sm">
                              {isViewOnly ? (
                                <>
                                  <span className="text-muted-foreground">
                                    Reservado
                                  </span>
                                  <span className="text-right tabular-nums">
                                    {row.initialQty}
                                  </span>

                                  <span className="text-muted-foreground">
                                    Vendido
                                  </span>
                                  <span className="text-right tabular-nums">
                                    {row.soldQty ?? 0}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Label
                                    htmlFor={`qty-mobile-${row.productId}`}
                                    className="text-muted-foreground"
                                  >
                                    Cantidad
                                  </Label>
                                  <Input
                                    id={`qty-mobile-${row.productId}`}
                                    type="number"
                                    step="1"
                                    min="1"
                                    max={row.maxQty}
                                    value={row.initialQty}
                                    onChange={(event) =>
                                      handleQtyChange(index, event.target.value)
                                    }
                                    onBlur={() => handleQtyBlur(row)}
                                    aria-invalid={qtyError !== undefined}
                                    className="ml-auto w-20 px-1.5 text-right"
                                  />
                                </>
                              )}

                              <span className="text-muted-foreground">
                                Subtotal venta
                              </span>
                              <span className="text-right tabular-nums">
                                {formatCurrency(
                                  row.unitPrice * (Number(row.initialQty) || 0),
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
                      data={formik.values.products}
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
                <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5">
                  {isViewOnly ? (
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
                            realTotal >= 0 ? 'text-emerald-600' : 'text-destructive'
                          }`}
                        >
                          {formatCurrency(realTotal)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Monto estimado de venta
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(estimatedTotal)}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            {isViewOnly ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={formik.isSubmitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={formik.isSubmitting || isLoadingLines}
                >
                  {isEditing ? 'Guardar cambios' : 'Registrar'}
                </Button>
              </>
            )}
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
