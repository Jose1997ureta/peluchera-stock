import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Layers,
  MoreVertical,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Checkbox } from '@/shared/components/motion/checkbox'
import {
  Table,
  type SortState,
  type TableColumn,
} from '@/shared/components/motion/table'
import { TableMenu } from '@/shared/components/motion/table/table-menu'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Product } from '@/shared/types/product'
import { formatCurrency } from '@/shared/utils/currency'
import type { ProductSortDirection, ProductSortKey } from '../hooks/api'
import { useProducts } from '../hooks/useProducts'
import { BulkActionsMenu } from './BulkActionsMenu'
import { ProductThumbnail } from './ProductThumbnail'

const PAGE_SIZE = 15
const DEFAULT_SORT: SortState = { key: 'name', direction: 'asc' }

export interface ProductsTabPanelProps {
  isActiveTab: boolean
  onEdit: (product: Product) => void
  onRequestConfirm: (
    action: 'activate' | 'deactivate' | 'delete',
    products: Product[],
  ) => void
  onCreateProduct: () => void
}

export function ProductsTabPanel({
  isActiveTab,
  onEdit,
  onRequestConfirm,
  onCreateProduct,
}: ProductsTabPanelProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState | null>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading, isFetching, isError, refetch } = useProducts({
    isActive: isActiveTab,
    search: debouncedSearch,
    sortKey: (sort?.key ?? DEFAULT_SORT.key) as ProductSortKey,
    sortDirection: (sort?.direction ??
      DEFAULT_SORT.direction) as ProductSortDirection,
    page,
    pageSize: PAGE_SIZE,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const selectedProducts = items.filter((product) =>
    selectedIds.includes(product.id),
  )

  function renderActions(row: Product) {
    return (
      <div className="flex justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Editar"
          onClick={() => onEdit(row)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={isActiveTab ? 'Desactivar' : 'Activar'}
          onClick={() =>
            onRequestConfirm(isActiveTab ? 'deactivate' : 'activate', [row])
          }
        >
          {isActiveTab ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Eliminar"
          onClick={() => onRequestConfirm('delete', [row])}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    )
  }

  function renderCardMenu(row: Product) {
    return (
      <TableMenu
        ariaLabel="Acciones"
        trigger={<MoreVertical className="size-4" />}
        triggerClassName="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        items={[
          {
            label: 'Editar',
            icon: <Pencil />,
            onSelect: () => onEdit(row),
          },
          {
            label: isActiveTab ? 'Desactivar' : 'Activar',
            icon: isActiveTab ? <EyeOff /> : <Eye />,
            onSelect: () =>
              onRequestConfirm(isActiveTab ? 'deactivate' : 'activate', [row]),
          },
          {
            label: 'Eliminar',
            icon: <Trash2 />,
            destructive: true,
            onSelect: () => onRequestConfirm('delete', [row]),
          },
        ]}
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
              {isActiveTab
                ? 'No hay productos activos todavía'
                : 'No hay productos desactivados'}
            </p>
            {isActiveTab ? (
              <p className="text-sm text-muted-foreground">
                Registrá tu primer producto para empezar a llevar el stock.
              </p>
            ) : null}
          </div>
          {isActiveTab ? (
            <Button size="sm" onClick={onCreateProduct}>
              <Plus className="size-4" />
              Crear producto
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  function toggleSelected(productId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...current, productId]
        : current.filter((id) => id !== productId),
    )
  }

  const columns = useMemo<TableColumn<Product>[]>(
    () => [
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
        key: 'imageUrl',
        header: '',
        width: '88px',
        cell: (row) => (
          <ProductThumbnail imageUrl={row.imageUrl} name={row.name} />
        ),
      },
      {
        key: 'name',
        header: 'Nombre',
        sortable: true,
        cell: (row) => (
          <span className="font-medium text-foreground">{row.name}</span>
        ),
      },
      {
        key: 'price',
        header: 'Precio',
        sortable: true,
        align: 'right',
        width: '140px',
        cell: (row) => (
          <span className="tabular-nums">{formatCurrency(row.price)}</span>
        ),
      },
      {
        key: 'stock',
        header: 'Stock',
        sortable: true,
        align: 'right',
        width: '100px',
        cell: (row) => <span className="tabular-nums">{row.stock}</span>,
      },
      {
        key: 'actions',
        header: 'Acciones',
        align: 'right',
        width: '160px',
        cell: renderActions,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- renderActions closes over isActiveTab/onEdit/onRequestConfirm, already listed below
    [isActiveTab, onEdit, onRequestConfirm, items, page],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        {selectedProducts.length > 0 ? (
          <BulkActionsMenu
            selectedCount={selectedProducts.length}
            isActiveTab={isActiveTab}
            onToggleActive={() =>
              onRequestConfirm(
                isActiveTab ? 'deactivate' : 'activate',
                selectedProducts,
              )
            }
            onDelete={() => onRequestConfirm('delete', selectedProducts)}
          />
        ) : null}
      </div>

      {isError ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            No se pudieron cargar los productos.
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
                Cargando productos...
              </p>
            ) : items.length === 0 ? (
              renderEmptyState()
            ) : (
              items.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="flex items-stretch gap-3">
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) =>
                        toggleSelected(product.id, checked)
                      }
                      aria-label={`Seleccionar ${product.name}`}
                      className="mt-1 shrink-0 self-start"
                    />
                    <ProductThumbnail
                      imageUrl={product.imageUrl}
                      name={product.name}
                      className="h-auto w-20 shrink-0 self-stretch rounded-xl"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="break-words font-semibold text-foreground">
                          {product.name}
                        </span>
                        {renderCardMenu(product)}
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CircleDollarSign className="size-3.5" />
                        <span>
                          Precio:{' '}
                          <span className="font-medium tabular-nums text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Layers className="size-3.5" />
                        <span>
                          Cantidad:{' '}
                          <span className="tabular-nums text-foreground">
                            {product.stock}
                          </span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block">
            {!isLoading && !isFetching && items.length === 0 ? (
              renderEmptyState()
            ) : (
              <Table
                data={items}
                columns={columns}
                getRowId={(row) => row.id}
                selectable
                selectedRowIds={selectedIds}
                onSelectionChange={setSelectedIds}
                sort={sort}
                onSortChange={(next) => {
                  setSort(next ?? DEFAULT_SORT)
                  setPage(1)
                }}
                loading={isLoading || isFetching}
                rowHeight={64}
                height={Math.max(items.length, 1) * 64 + 56}
                className="rounded-2xl"
              />
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} producto{total !== 1 ? 's' : ''}
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
