import { Archive, Filter, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog'
import { MetricCard } from '@/shared/components/MetricCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/motion/select'
import { Table, type TableColumn } from '@/shared/components/motion/table'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useZonas } from '@/features/activities/hooks/useZonas'
import { toast } from '@/shared/lib/toast'
import type { CashCut } from '@/shared/types/cashCut'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { useCashCuts } from '../hooks/useCashCuts'
import { useCreateCashCut } from '../hooks/useCreateCashCut'
import { useCurrentCut } from '../hooks/useCurrentCut'
import { useHistoricalSummary } from '../hooks/useHistoricalSummary'

const ALL_ZONES = 'all'

function ProfitAmount({ amount, size }: { amount: number; size: 'lg' | 'sm' }) {
  const className =
    size === 'lg'
      ? `text-2xl font-semibold ${amount >= 0 ? 'text-foreground' : 'text-destructive'}`
      : `tabular-nums ${amount >= 0 ? '' : 'text-destructive'}`
  return <span className={className}>{formatCurrency(amount)}</span>
}

export default function CajaChicaPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const currentCut = useCurrentCut()
  const cashCuts = useCashCuts()
  const createCashCut = useCreateCashCut()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [zonaFilter, setZonaFilter] = useState(ALL_ZONES)
  const { data: zonas } = useZonas()
  const summary = useHistoricalSummary({
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    zonaId: zonaFilter === ALL_ZONES ? null : Number(zonaFilter),
  })
  const hasActiveFilters = Boolean(dateFrom || dateTo || zonaFilter !== ALL_ZONES)

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setZonaFilter(ALL_ZONES)
  }

  const data = currentCut.data
  const canStartCut = Boolean(data && data.activitiesCount > 0)

  async function handleConfirmCut() {
    try {
      await createCashCut.mutateAsync()
      toast.success(`Corte realizado. Se archivaron ${data?.activitiesCount ?? 0} actividades.`)
      setConfirmOpen(false)
    } catch {
      toast.error('No se pudo realizar el corte. Intentá de nuevo.')
    }
  }

  const columns: TableColumn<CashCut>[] = [
    {
      key: 'closedAt',
      header: 'Fecha del corte',
      align: 'left',
      cell: (row) => <span className="tabular-nums">{formatDate(row.closedAt)}</span>,
    },
    {
      key: 'activitiesCount',
      header: 'Actividades',
      align: 'right',
      width: '110px',
      cell: (row) => <span className="tabular-nums">{row.activitiesCount}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Subtotal real',
      align: 'right',
      width: '130px',
      cell: (row) => <span className="tabular-nums">{formatCurrency(row.totalRevenue)}</span>,
    },
    {
      key: 'totalProfit',
      header: 'Ganancia',
      align: 'right',
      width: '130px',
      cell: (row) => <ProfitAmount amount={row.totalProfit} size="sm" />,
    },
  ]

  const cuts = cashCuts.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Corte actual</h2>
          <Button disabled={!canStartCut} onClick={() => setConfirmOpen(true)}>
            Iniciar corte
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {data && data.activitiesCount > 0
            ? `Acumulando desde ${data.since ? formatDate(data.since) : '—'} · ${data.activitiesCount} actividad${data.activitiesCount !== 1 ? 'es' : ''} cerrada${data.activitiesCount !== 1 ? 's' : ''} incluida${data.activitiesCount !== 1 ? 's' : ''}.`
            : 'Todavía no hay actividades cerradas pendientes de corte.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            title="Subtotal real"
            icon={<Wallet className="size-4 text-primary" />}
            isLoading={currentCut.isLoading}
            isError={currentCut.isError}
            onRetry={currentCut.refetch}
          >
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(data?.totalRevenue ?? 0)}
            </p>
          </MetricCard>

          <MetricCard
            title="Ganancia"
            icon={<TrendingUp className="size-4 text-primary" />}
            isLoading={currentCut.isLoading}
            isError={currentCut.isError}
            onRetry={currentCut.refetch}
          >
            <ProfitAmount amount={data?.totalProfit ?? 0} size="lg" />
          </MetricCard>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Historial de cortes</h2>

        {cashCuts.isError ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">No se pudo cargar el historial de cortes.</p>
            <Button size="sm" variant="outline" onClick={() => cashCuts.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : cuts.length === 0 && !cashCuts.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Todavía no se hizo ningún corte.
          </p>
        ) : (
          <>
            {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
            <div className="flex flex-col gap-3 md:hidden">
              {cashCuts.isLoading
                ? null
                : cuts.map((cut) => (
                    <Card key={cut.id}>
                      <CardContent className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {formatDate(cut.closedAt)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {cut.activitiesCount} actividad{cut.activitiesCount !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1 text-sm">
                          <span className="text-muted-foreground">Subtotal real</span>
                          <span className="text-right tabular-nums">
                            {formatCurrency(cut.totalRevenue)}
                          </span>
                          <span className="text-muted-foreground">Ganancia</span>
                          <span className="text-right">
                            <ProfitAmount amount={cut.totalProfit} size="sm" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            <div className="hidden md:block">
              <Table
                data={cuts}
                columns={columns}
                getRowId={(row) => row.id}
                loading={cashCuts.isLoading}
                rowHeight={56}
                height={Math.max(cuts.length, 1) * 56 + 44}
                className="rounded-2xl"
              />
            </div>
          </>
        )}
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Archive className="size-4 text-muted-foreground" />
            Resumen histórico
          </CardTitle>
          {hasActiveFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-end">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground sm:pb-2">
              <Filter className="size-4" />
              Filtrar por
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resumen-fecha-desde">Desde</Label>
              <Input
                id="resumen-fecha-desde"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="sm:w-44"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resumen-fecha-hasta">Hasta</Label>
              <Input
                id="resumen-fecha-hasta"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="sm:w-44"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Zona</Label>
              <Select value={zonaFilter} onValueChange={setZonaFilter}>
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
          </div>

          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? `${summary.data?.activitiesCount ?? 0} actividad${summary.data?.activitiesCount === 1 ? '' : 'es'} cerrada${summary.data?.activitiesCount === 1 ? '' : 's'} en el rango filtrado.`
              : `Todo el historial · ${summary.data?.activitiesCount ?? 0} actividad${summary.data?.activitiesCount === 1 ? '' : 'es'} cerrada${summary.data?.activitiesCount === 1 ? '' : 's'}.`}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              title="Inversión"
              icon={<Wallet className="size-4 text-amber-600 dark:text-amber-500" />}
              isLoading={summary.isLoading}
              isError={summary.isError}
              onRetry={summary.refetch}
            >
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(summary.data?.totalInvested ?? 0)}
              </p>
            </MetricCard>

            <MetricCard
              title="Ganancia"
              icon={<TrendingUp className="size-4 text-amber-600 dark:text-amber-500" />}
              isLoading={summary.isLoading}
              isError={summary.isError}
              onRetry={summary.refetch}
            >
              <ProfitAmount amount={summary.data?.totalProfit ?? 0} size="lg" />
            </MetricCard>
          </div>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Iniciar corte"
        description="Se archivarán el subtotal real y la ganancia acumulados hasta ahora como un registro histórico, y el corte actual volverá a $0. Esta acción no se puede deshacer."
        confirmLabel="Iniciar corte"
        isPending={createCashCut.isPending}
        onConfirm={handleConfirmCut}
      />
    </div>
  )
}
