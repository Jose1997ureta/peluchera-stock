import { ArrowDown, ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '@/shared/components/MetricCard'
import { LOW_STOCK_THRESHOLD } from '@/shared/core/constants'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import { useCurrentCashCut } from '@/features/caja-chica/hooks/useCurrentCashCut'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { SalesPeriodCard } from './SalesPeriodCard'

function stockSeverityColor(stock: number): string {
  return stock === 0 || stock / LOW_STOCK_THRESHOLD < 0.34 ? 'bg-destructive' : 'bg-amber-500'
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardMetrics()
  const {
    data: currentCashCut,
    isLoading: isCashCutLoading,
    isError: isCashCutError,
    refetch: refetchCashCut,
  } = useCurrentCashCut()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard title="Ventas del mes" isLoading={isLoading} isError={isError} onRetry={refetch}>
        <p className="text-2xl font-semibold text-foreground">
          {formatCurrency(data?.salesThisMonth ?? 0)}
        </p>
      </MetricCard>

      <MetricCard
        title="Actividad más rentable"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data?.topActivity ? (
          <>
            <p className="truncate text-lg font-semibold text-foreground">
              {data.topActivity.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(data.topActivity.amount)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay actividades cerradas.</p>
        )}
      </MetricCard>

      <MetricCard
        title="Productos con stock bajo"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && data.lowStockCount > 0 ? (
          <>
            <p className="text-2xl font-semibold text-foreground">{data.lowStockCount}</p>
            <ul className="mt-3 space-y-2">
              {data.lowStockProducts.map((product) => (
                <li key={product.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-muted-foreground">{product.name}</span>
                    <span className="font-medium text-foreground">{product.stock} u.</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', stockSeverityColor(product.stock))}
                      style={{
                        width: `${Math.min(100, (product.stock / LOW_STOCK_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todo el stock está en niveles saludables.
          </p>
        )}
      </MetricCard>

      <MetricCard
        title="Estado de caja chica"
        isLoading={isCashCutLoading}
        isError={isCashCutError}
        onRetry={refetchCashCut}
      >
        {currentCashCut ? (
          <>
            <p className="text-lg font-semibold text-foreground">
              Abierta desde {formatDate(currentCashCut.openedAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              Monto inicial {formatCurrency(currentCashCut.initialAmount)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Sin caja abierta.</p>
            <Link to="/caja-chica" className="text-sm font-medium text-primary hover:underline">
              Ir a Caja Chica
            </Link>
          </>
        )}
      </MetricCard>

      <MetricCard
        title="Actividades abiertas"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && data.openActivities.count > 0 ? (
          <>
            <p className="text-2xl font-semibold text-foreground">{data.openActivities.count}</p>
            {data.openActivities.oldest && (
              <p className="text-sm text-muted-foreground">
                Más antigua: {data.openActivities.oldest.name} ·{' '}
                {data.openActivities.oldest.daysOpen} día(s)
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No hay actividades abiertas.</p>
        )}
      </MetricCard>

      <MetricCard
        title="Ventas: mes actual vs. anterior"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(data.salesComparison.currentMonth)}
              </p>
              {data.salesComparison.percentChange !== 0 && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-sm font-medium',
                    data.salesComparison.percentChange > 0 ? 'text-emerald-600' : 'text-destructive',
                  )}
                >
                  {data.salesComparison.percentChange > 0 ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {Math.abs(data.salesComparison.percentChange).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="mt-3 flex items-end gap-2">
              {(() => {
                const max = Math.max(
                  data.salesComparison.currentMonth,
                  data.salesComparison.previousMonth,
                  1,
                )
                return (
                  <>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-muted"
                        style={{
                          height: `${Math.max(4, (data.salesComparison.previousMonth / max) * 48)}px`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Anterior</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-primary"
                        style={{
                          height: `${Math.max(4, (data.salesComparison.currentMonth / max) * 48)}px`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Actual</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </>
        )}
      </MetricCard>

      <MetricCard
        title="Ticket promedio por actividad"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data?.averageTicket !== null && data?.averageTicket !== undefined ? (
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(data.averageTicket)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay actividades cerradas.</p>
        )}
      </MetricCard>

      <MetricCard
        title="Stock valorizado"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        <p className="text-2xl font-semibold text-foreground">
          {formatCurrency(data?.inventoryValue ?? 0)}
        </p>
      </MetricCard>

      <MetricCard
        title="Productos más vendidos"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && data.topProducts.length > 0 ? (
          <ul className="space-y-2">
            {data.topProducts.map((product) => (
              <li key={product.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{product.name}</span>
                  <span className="font-medium text-foreground">{product.soldQty} u.</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(product.soldQty / data.topProducts[0].soldQty) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay ventas registradas.</p>
        )}
      </MetricCard>

      <MetricCard
        title="Ventas por período"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && <SalesPeriodCard salesHistory={data.salesHistory} />}
      </MetricCard>
    </div>
  )
}
