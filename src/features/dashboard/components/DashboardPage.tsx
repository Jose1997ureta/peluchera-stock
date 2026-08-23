import { ArrowDown, ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '@/shared/components/MetricCard'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import { useCashCuts } from '@/features/caja-chica/hooks/useCashCuts'
import { useCurrentCashCut } from '@/features/caja-chica/hooks/useCurrentCashCut'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { PeriodChartCard } from './PeriodChartCard'

function formatActivityCount(value: number): string {
  return `${Math.round(value)}`
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardMetrics()
  const {
    data: currentCashCut,
    isLoading: isCashCutLoading,
    isError: isCashCutError,
    refetch: refetchCashCut,
  } = useCurrentCashCut()
  const {
    data: cashCutHistory,
    isLoading: isCashCutHistoryLoading,
    isError: isCashCutHistoryError,
    refetch: refetchCashCutHistory,
  } = useCashCuts()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Inversión por período"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && <PeriodChartCard history={data.investmentHistory} />}
      </MetricCard>

      <MetricCard
        title="Ganancia por período"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && <PeriodChartCard history={data.profitHistory} />}
      </MetricCard>

      <MetricCard
        title="Actividades por período"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && (
          <PeriodChartCard history={data.activitiesHistory} formatValue={formatActivityCount} />
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
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-muted-foreground">Abierta hace más tiempo</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {data.openActivities.oldest.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.openActivities.oldest.daysOpen === 0
                    ? 'Abierta hoy'
                    : `${data.openActivities.oldest.daysOpen} día(s) abierta`}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No hay actividades abiertas.</p>
        )}
      </MetricCard>

      <MetricCard
        title="Inversión: mes actual vs. anterior"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(data.investmentComparison.currentMonth)}
              </p>
              {data.investmentComparison.percentChange !== 0 && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-sm font-medium',
                    data.investmentComparison.percentChange > 0
                      ? 'text-emerald-600'
                      : 'text-destructive',
                  )}
                >
                  {data.investmentComparison.percentChange > 0 ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {Math.abs(data.investmentComparison.percentChange).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="mt-3 flex items-end gap-2">
              {(() => {
                const max = Math.max(
                  data.investmentComparison.currentMonth,
                  data.investmentComparison.previousMonth,
                  1,
                )
                return (
                  <>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-muted"
                        style={{
                          height: `${Math.max(4, (data.investmentComparison.previousMonth / max) * 48)}px`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Anterior</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-primary"
                        style={{
                          height: `${Math.max(4, (data.investmentComparison.currentMonth / max) * 48)}px`,
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
        title="Ganancia acumulada histórica"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        <p className="text-2xl font-semibold text-foreground">
          {formatCurrency(data?.allTime.profit ?? 0)}
        </p>
        <p className="text-sm text-muted-foreground">
          Inversión histórica: {formatCurrency(data?.allTime.investment ?? 0)}
        </p>
      </MetricCard>

      <MetricCard
        title="Margen promedio"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        <p className="text-2xl font-semibold text-foreground">
          {(data?.averageMarginPercent ?? 0).toFixed(0)}%
        </p>
        <p className="text-sm text-muted-foreground">Ganancia / inversión, histórico</p>
      </MetricCard>

      <MetricCard
        title="Ranking de zonas (mes actual)"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      >
        {data && data.zoneRanking.length > 0 ? (
          <ul className="space-y-2">
            {data.zoneRanking.map((zone) => (
              <li key={zone.zonaId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{zone.zoneName}</span>
                  <span className="font-medium text-foreground">{formatCurrency(zone.profit)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(
                        0,
                        (zone.profit / data.zoneRanking[0].profit) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay actividades cerradas este mes.
          </p>
        )}
      </MetricCard>

      <MetricCard
        title="Historial de cajas cerradas"
        isLoading={isCashCutHistoryLoading}
        isError={isCashCutHistoryError}
        onRetry={refetchCashCutHistory}
      >
        {cashCutHistory && cashCutHistory.length > 0 ? (
          <ul className="space-y-2">
            {cashCutHistory.slice(0, 5).map((cashCut) => (
              <li key={cashCut.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Caja #{cashCut.sequenceNumber} · {cashCut.closedAt && formatDate(cashCut.closedAt)}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(cashCut.totalProfit)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay cajas cerradas.</p>
        )}
      </MetricCard>
    </div>
  )
}
