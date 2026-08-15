import { MetricCard } from '@/shared/components/MetricCard'
import { formatCurrency } from '@/shared/utils/currency'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardMetrics()

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
            <ul className="mt-2 space-y-1">
              {data.lowStockProducts.map((product) => (
                <li key={product.id} className="text-sm text-muted-foreground">
                  {product.name} · {product.stock} u.
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
    </div>
  )
}
