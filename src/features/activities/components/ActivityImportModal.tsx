import { ArrowLeft, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { toast } from '@/shared/lib/toast'
import { formatCurrency } from '@/shared/utils/currency'
import { useClosedActivitiesForImport } from '../hooks/useClosedActivitiesForImport'
import { useClosedActivityLeftoverLines } from '../hooks/useClosedActivityLeftoverLines'
import { useProductsByIds } from '../hooks/useProductsByIds'
import type { ActivityLineFormValues } from '../schemas/activity.schema'
import { ActivityProductThumbnail } from './ActivityProductThumbnail'

export interface ActivityImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si ya se confirmó una importación antes en esta misma sesión de creación, la próxima reemplaza todo el formulario. */
  hasImportedBefore: boolean
  onImport: (lines: ActivityLineFormValues[], replace: boolean) => void
}

export function ActivityImportModal({
  open,
  onOpenChange,
  hasImportedBefore,
  onImport,
}: ActivityImportModalProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  )
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)

  const { data: closedActivities, isLoading: isLoadingActivities } =
    useClosedActivitiesForImport(debouncedSearch)
  const { data: leftoverLines, isLoading: isLoadingLines } =
    useClosedActivityLeftoverLines(selectedActivityId)

  const leftoverProductIds = useMemo(
    () => (leftoverLines ?? []).map((line) => line.productId),
    [leftoverLines],
  )
  const { data: leftoverProducts, isLoading: isLoadingProducts } =
    useProductsByIds(leftoverProductIds)
  const productsById = useMemo(
    () => new Map((leftoverProducts ?? []).map((product) => [product.id, product])),
    [leftoverProducts],
  )

  const isLoadingPreview =
    selectedActivityId !== null &&
    (isLoadingLines || (leftoverProductIds.length > 0 && isLoadingProducts))

  const previewRows = useMemo(() => {
    if (!leftoverLines) return []
    return leftoverLines
      .map((line) => {
        const product = productsById.get(line.productId)
        const leftoverQty = line.initialQty - line.soldQty
        const cappedQty = product ? Math.min(leftoverQty, product.stock) : leftoverQty
        return {
          productId: line.productId,
          productName: product?.name ?? line.productId,
          productImageUrl: product?.imageUrl ?? null,
          unitPrice: product?.price ?? line.unitPrice,
          maxQty: product?.stock ?? leftoverQty,
          leftoverQty,
          cappedQty,
          wasCapped: cappedQty < leftoverQty,
        }
      })
      .filter((row) => row.cappedQty > 0)
  }, [leftoverLines, productsById])

  function resetState() {
    setSearch('')
    setSelectedActivityId(null)
    setReplaceConfirmOpen(false)
  }

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear transient UI state when the modal closes, not an external sync
      resetState()
    }
  }, [open])

  function buildLinesToImport(): ActivityLineFormValues[] {
    return previewRows
      .filter((row) => row.cappedQty > 0)
      .map((row) => ({
        productId: row.productId,
        productName: row.productName,
        productImageUrl: row.productImageUrl,
        unitPrice: row.unitPrice,
        maxQty: row.maxQty,
        initialQty: String(row.cappedQty),
      }))
  }

  function applyImport() {
    const cappedRows = previewRows.filter((row) => row.wasCapped && row.cappedQty > 0)
    cappedRows.forEach((row) => {
      toast.info(
        `"${row.productName}": el sobrante (${row.leftoverQty}) supera el stock disponible, se importó con ${row.cappedQty}.`,
      )
    })
    onImport(buildLinesToImport(), hasImportedBefore)
    onOpenChange(false)
  }

  function handleImportClick() {
    if (hasImportedBefore) {
      setReplaceConfirmOpen(true)
    } else {
      applyImport()
    }
  }

  const hasLeftover = previewRows.length > 0
  const canImport = hasLeftover && !isLoadingPreview

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel="Importar de actividad cerrada"
        autoFocus={false}
        className="max-w-lg md:max-w-2xl"
      >
        <div className="flex max-h-[80vh] flex-col p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Importar de actividad cerrada
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí una actividad cerrada para traer los productos que sobraron.
          </p>

          {selectedActivityId === null ? (
            <div className="relative mt-4 w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar actividad cerrada por nombre..."
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
          ) : (
            <button
              type="button"
              onClick={() => setSelectedActivityId(null)}
              className="mt-4 flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Elegir otra actividad
            </button>
          )}

          <div className="-mx-1 mt-3 min-h-0 flex-1 overflow-y-auto p-1">
            {selectedActivityId === null ? (
              isLoadingActivities ? (
                <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
              ) : (closedActivities ?? []).length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No se encontraron actividades cerradas.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(closedActivities ?? []).map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelectedActivityId(activity.id)}
                      className="flex flex-col rounded-xl border border-border px-3.5 py-3 text-left text-sm shadow-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">
                        {activity.name}
                      </span>
                      {activity.closedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Cerrada el{' '}
                          {new Date(activity.closedAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )
            ) : isLoadingPreview ? (
              <p className="p-3 text-sm text-muted-foreground">Cargando...</p>
            ) : !hasLeftover ? (
              <p className="p-3 text-sm text-muted-foreground">
                Esta actividad no tiene productos sobrantes para importar.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previewRows.map((row) => (
                  <div
                    key={row.productId}
                    className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <ActivityProductThumbnail
                        imageUrl={row.productImageUrl}
                        name={row.productName}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">
                          {row.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(row.unitPrice)} c/u
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground">
                        Cantidad a importar
                      </span>
                      <span className="tabular-nums font-semibold text-foreground">
                        {row.cappedQty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={!canImport} onClick={handleImportClick}>
              Importar
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>

      <CenterMorphModal open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <CenterMorphModalContent ariaLabel="Confirmar reemplazo">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Reemplazar productos
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Esto va a reemplazar todos los productos actuales del formulario,
              incluidos los agregados a mano. ¿Confirmás?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReplaceConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setReplaceConfirmOpen(false)
                  applyImport()
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </CenterMorphModal>
  )
}
