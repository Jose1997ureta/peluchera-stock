import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  MoreVertical,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/motion/select'
import { AnimatedBadge } from '@/shared/components/motion/animated-badge'
import {
  Table,
  type SortState,
  type TableColumn,
} from '@/shared/components/motion/table'
import { TableMenu } from '@/shared/components/motion/table/table-menu'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Activity } from '@/shared/types/activity'
import { formatDate } from '@/shared/utils/date'
import { formatCurrency } from '@/shared/utils/currency'
import type { ActivitySortDirection, ActivitySortKey } from '../hooks/api'
import { useActivities } from '../hooks/useActivities'
import { useZonas } from '../hooks/useZonas'

const ALL_ZONES = 'all'

const PAGE_SIZE = 20
const DEFAULT_SORT: SortState = { key: 'createdAt', direction: 'desc' }

/** Ancho mínimo legible de la columna "Nombre" antes de recurrir a scroll horizontal. */
const MIN_NAME_WIDTH = 220
/** Suma de los anchos fijos del resto de columnas (# + Zona + Productos + Monto est. + Monto real + Creada + Acciones). */
function otherColumnsWidth(isOpenTab: boolean): number {
  return 56 + 120 + 110 + 150 + 150 + 120 + (isOpenTab ? 190 : 110)
}

function estimatedAmount(activity: Activity): number {
  return activity.products.reduce(
    (sum, line) => sum + line.unitPrice * line.initialQty,
    0,
  )
}

function soldAmount(activity: Activity): number {
  return activity.products.reduce(
    (sum, line) => sum + line.unitPrice * line.soldQty,
    0,
  )
}

export interface ActivitiesTabPanelProps {
  isOpenTab: boolean
  onEdit: (activity: Activity) => void
  onView: (activity: Activity) => void
  onFill: (activity: Activity) => void
  onRequestDelete: (activity: Activity) => void
  onCreateActivity: () => void
}

export function ActivitiesTabPanel({
  isOpenTab,
  onEdit,
  onView,
  onFill,
  onRequestDelete,
  onCreateActivity,
}: ActivitiesTabPanelProps) {
  const [search, setSearch] = useState('')
  const [zonaFilter, setZonaFilter] = useState(ALL_ZONES)
  const [sort, setSort] = useState<SortState | null>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: zonas } = useZonas()
  const zoneNameById = useMemo(
    () => new Map((zonas ?? []).map((zone) => [zone.id, zone.name])),
    [zonas],
  )

  const { data, isLoading, isFetching, isError, refetch } = useActivities({
    status: isOpenTab ? 'open' : 'closed',
    search: debouncedSearch,
    zonaId: zonaFilter === ALL_ZONES ? null : Number(zonaFilter),
    sortKey: (sort?.key ?? DEFAULT_SORT.key) as ActivitySortKey,
    sortDirection: (sort?.direction ??
      DEFAULT_SORT.direction) as ActivitySortDirection,
    page,
    pageSize: PAGE_SIZE,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Mide el ancho disponible para decidir si "Nombre" puede expandirse a llenar
  // el espacio sobrante (como cualquier tabla normal) o si hay que fijarle un
  // ancho mínimo y dejar que la tabla scrollee horizontalmente en su lugar —
  // undefined (antes de la primera medición) asume que sí entra, para no
  // arrancar angosta en el caso más común (pantallas anchas).
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [wrapperWidth, setWrapperWidth] = useState<number | null>(null)
  useEffect(() => {
    const el = tableWrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setWrapperWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const nameFillsRemaining =
    wrapperWidth === null ||
    wrapperWidth - otherColumnsWidth(isOpenTab) >= MIN_NAME_WIDTH

  function renderActions(row: Activity) {
    return (
      <div className="flex justify-end gap-1">
        {isOpenTab ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Rellenar"
              onClick={() => onFill(row)}
            >
              <ClipboardCheck className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Ver"
              onClick={() => onView(row)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Editar"
              onClick={() => onEdit(row)}
            >
              <Pencil className="size-4" />
            </Button>
          </>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Ver"
            onClick={() => onView(row)}
          >
            <Eye className="size-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Eliminar"
          onClick={() => onRequestDelete(row)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    )
  }

  // "Ver" no aparece acá: en mobile se accede tocando la card directamente
  // (ver onClick en el Card más abajo), así que el menú solo trae acciones
  // que modifican datos.
  function renderCardMenu(row: Activity) {
    const items = isOpenTab
      ? [
          {
            label: 'Rellenar',
            icon: <ClipboardCheck />,
            onSelect: () => onFill(row),
          },
          {
            label: 'Editar',
            icon: <Pencil />,
            onSelect: () => onEdit(row),
          },
          {
            label: 'Eliminar',
            icon: <Trash2 />,
            destructive: true,
            onSelect: () => onRequestDelete(row),
          },
        ]
      : [
          {
            label: 'Eliminar',
            icon: <Trash2 />,
            destructive: true,
            onSelect: () => onRequestDelete(row),
          },
        ]

    return (
      <TableMenu
        ariaLabel="Acciones"
        trigger={<MoreVertical className="size-4" />}
        triggerClassName="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        items={items}
      />
    )
  }

  function renderEmptyState() {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">
              {isOpenTab
                ? 'No hay actividades abiertas todavía'
                : 'No hay actividades cerradas'}
            </p>
            {isOpenTab ? (
              <p className="text-sm text-muted-foreground">
                Creá tu primera actividad para empezar a vender.
              </p>
            ) : null}
          </div>
          {isOpenTab ? (
            <Button size="sm" onClick={onCreateActivity}>
              <Plus className="size-4" />
              Crear actividad
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  const columns: TableColumn<Activity>[] = [
    {
      key: 'rowNumber',
      header: '#',
      width: '56px',
      cell: (row) => {
        const index = items.findIndex((item) => item.id === row.id)
        return (
          <span className="tabular-nums text-muted-foreground">
            {(page - 1) * PAGE_SIZE + index + 1}
          </span>
        )
      },
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      width: nameFillsRemaining ? undefined : `${MIN_NAME_WIDTH}px`,
      cell: (row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      key: 'zona',
      header: 'Zona',
      width: '120px',
      cell: (row) => (
        <span>{zoneNameById.get(row.zonaId) ?? '—'}</span>
      ),
    },
    {
      key: 'productsCount',
      header: 'Productos',
      align: 'right',
      width: '110px',
      cell: (row) => (
        <span className="tabular-nums">{row.products.length}</span>
      ),
    },
    {
      key: 'estimatedAmount',
      header: 'Monto estimado',
      sortable: true,
      align: 'right',
      width: '150px',
      cell: (row) => (
        <span className="tabular-nums">
          {formatCurrency(estimatedAmount(row))}
        </span>
      ),
    },
    {
      key: 'soldAmount',
      header: 'Monto real',
      sortable: true,
      align: 'right',
      width: '150px',
      cell: (row) => (
        <span className="tabular-nums">{formatCurrency(soldAmount(row))}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creada',
      sortable: true,
      align: 'right',
      width: '120px',
      cell: (row) => (
        <span className="tabular-nums">
          {new Date(row.createdAt).toLocaleDateString('es-PE')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      width: isOpenTab ? '190px' : '110px',
      cell: renderActions,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nombre..."
            className="pl-8"
          />
        </div>

        <Select
          value={zonaFilter}
          onValueChange={(value) => {
            setZonaFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ZONES}>Todas las zonas</SelectItem>
            {(zonas ?? []).map((zone) => (
              <SelectItem key={zone.id} value={String(zone.id)}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            No se pudieron cargar las actividades.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
          <div className="flex flex-col gap-3 md:hidden">
            {isLoading || isFetching ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Cargando actividades...
              </p>
            ) : items.length === 0 ? (
              renderEmptyState()
            ) : (
              items.map((activity) => {
                const estimated = estimatedAmount(activity)
                const sold = soldAmount(activity)
                const progress =
                  estimated > 0
                    ? Math.min(100, Math.round((sold / estimated) * 100))
                    : 0
                return (
                  <Card
                    key={activity.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onView(activity)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onView(activity)
                      }
                    }}
                    className={`relative cursor-pointer overflow-hidden border-l-4 ${
                      isOpenTab ? 'border-l-primary' : 'border-l-emerald-500'
                    }`}
                  >
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col items-start gap-1.5">
                          <span className="break-words font-semibold text-foreground">
                            {activity.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <AnimatedBadge
                              size="sm"
                              status={isOpenTab ? 'info' : 'success'}
                              showIcon={false}
                            >
                              {isOpenTab ? 'Abierta' : 'Cerrada'}
                            </AnimatedBadge>
                            <AnimatedBadge
                              size="sm"
                              status="neutral"
                              icon={<CalendarDays className="size-3" />}
                            >
                              {formatDate(activity.createdAt)}
                            </AnimatedBadge>
                            <AnimatedBadge size="sm" status="neutral" showIcon={false}>
                              {zoneNameById.get(activity.zonaId) ?? '—'}
                            </AnimatedBadge>
                          </div>
                        </div>
                        {renderCardMenu(activity)}
                      </div>

                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Package className="size-3.5" />
                            Productos
                          </span>
                          <span className="tabular-nums">
                            {activity.products.length}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Wallet className="size-3.5" />
                            Monto estimado
                          </span>
                          <span className="tabular-nums">
                            {formatCurrency(estimated)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Wallet className="size-3.5" />
                            Monto real
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatCurrency(sold)}
                          </span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOpenTab ? 'bg-primary' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <div ref={tableWrapperRef} className="hidden md:block">
            {!isLoading && !isFetching && items.length === 0 ? (
              renderEmptyState()
            ) : (
              <Table
                data={items}
                columns={columns}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={(next) => {
                  setSort(next ?? DEFAULT_SORT)
                  setPage(1)
                }}
                loading={isLoading || isFetching}
                rowHeight={64}
                // +20px: cuando las columnas (todas con ancho fijo) exceden el ancho
                // del contenedor, aparece scroll horizontal, y esa barra le resta alto
                // útil al viewport — sin este margen, ese alto perdido dispara además
                // un scroll vertical espurio aunque el contenido entre de sobra.
                height={(Math.max(items.length, 1) + 1) * 64 + 20}
                className="rounded-2xl"
              />
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} actividad{total !== 1 ? 'es' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span>
            Página {page} de {totalPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
