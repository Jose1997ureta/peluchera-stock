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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/motion/tabs'
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
import { useCloseCashCut } from '../hooks/useCloseCashCut'
import { useCurrentCashCut } from '../hooks/useCurrentCashCut'
import { useHistoricalSummary } from '../hooks/useHistoricalSummary'
import { useOpenCashCut } from '../hooks/useOpenCashCut'
import { OpenCashCutForm } from './OpenCashCutForm'

const ALL_ZONES = 'all'

function ProfitAmount({ amount, size }: { amount: number; size: 'lg' | 'sm' }) {
  const className =
    size === 'lg'
      ? `text-2xl font-semibold ${amount >= 0 ? 'text-foreground' : 'text-destructive'}`
      : `tabular-nums ${amount >= 0 ? '' : 'text-destructive'}`
  return <span className={className}>{formatCurrency(amount)}</span>
}

function CajaChicaTab() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const currentCashCut = useCurrentCashCut()
  const cashCuts = useCashCuts()
  const openCashCut = useOpenCashCut()
  const closeCashCut = useCloseCashCut()

  const cut = currentCashCut.data

  async function handleOpenCashCut(initialAmount: number) {
    try {
      await openCashCut.mutateAsync(initialAmount)
      toast.success('Caja abierta.')
    } catch {
      toast.error('No se pudo abrir la caja. Intentá de nuevo.')
    }
  }

  async function handleConfirmClose() {
    try {
      await closeCashCut.mutateAsync()
      toast.success('Caja cerrada.')
      setConfirmOpen(false)
    } catch {
      toast.error('No se pudo cerrar la caja. Intentá de nuevo.')
    }
  }

  const columns: TableColumn<CashCut>[] = [
    {
      key: 'openedAt',
      header: 'Apertura',
      align: 'left',
      cell: (row) => <span className="tabular-nums">{formatDate(row.openedAt)}</span>,
    },
    {
      key: 'closedAt',
      header: 'Cierre',
      align: 'left',
      cell: (row) => <span className="tabular-nums">{row.closedAt ? formatDate(row.closedAt) : '—'}</span>,
    },
    {
      key: 'initialAmount',
      header: 'Monto inicial',
      align: 'right',
      width: '130px',
      cell: (row) => <span className="tabular-nums">{formatCurrency(row.initialAmount)}</span>,
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
        {currentCashCut.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando estado de la caja...</p>
        ) : !cut ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Apertura de la Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OpenCashCutForm isPending={openCashCut.isPending} onSubmit={handleOpenCashCut} />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Caja abierta</h2>
              <Button disabled={closeCashCut.isPending} onClick={() => setConfirmOpen(true)}>
                Cerrar caja
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Abierta desde {formatDate(cut.openedAt)} · Monto inicial {formatCurrency(cut.initialAmount)} ·{' '}
              {cut.activitiesCount} actividad{cut.activitiesCount !== 1 ? 'es' : ''} cerrada
              {cut.activitiesCount !== 1 ? 's' : ''}.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                title="Subtotal real"
                icon={<Wallet className="size-4 text-primary" />}
                isLoading={currentCashCut.isLoading}
                isError={currentCashCut.isError}
                onRetry={currentCashCut.refetch}
              >
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(cut.totalRevenue)}
                </p>
              </MetricCard>

              <MetricCard
                title="Ganancia"
                icon={<TrendingUp className="size-4 text-primary" />}
                isLoading={currentCashCut.isLoading}
                isError={currentCashCut.isError}
                onRetry={currentCashCut.refetch}
              >
                <ProfitAmount amount={cut.totalProfit} size="lg" />
              </MetricCard>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Historial de cajas</h2>

        {cashCuts.isError ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">No se pudo cargar el historial de cajas.</p>
            <Button size="sm" variant="outline" onClick={() => cashCuts.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : cuts.length === 0 && !cashCuts.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Todavía no se cerró ninguna caja.
          </p>
        ) : (
          <>
            {/* Mobile: cards apiladas. Desktop (md+): tabla. */}
            <div className="flex flex-col gap-3 md:hidden">
              {cashCuts.isLoading
                ? null
                : cuts.map((historicCut) => (
                    <Card key={historicCut.id}>
                      <CardContent className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {formatDate(historicCut.openedAt)} → {formatDate(historicCut.closedAt ?? '')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {historicCut.activitiesCount} actividad
                            {historicCut.activitiesCount !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1 text-sm">
                          <span className="text-muted-foreground">Monto inicial</span>
                          <span className="text-right tabular-nums">
                            {formatCurrency(historicCut.initialAmount)}
                          </span>
                          <span className="text-muted-foreground">Subtotal real</span>
                          <span className="text-right tabular-nums">
                            {formatCurrency(historicCut.totalRevenue)}
                          </span>
                          <span className="text-muted-foreground">Ganancia</span>
                          <span className="text-right">
                            <ProfitAmount amount={historicCut.totalProfit} size="sm" />
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

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cerrar caja"
        description="Se archivará el subtotal real y la ganancia acumulados por esta caja como un registro histórico. Esta acción no se puede deshacer."
        confirmLabel="Sí, cerrar caja"
        isPending={closeCashCut.isPending}
        onConfirm={handleConfirmClose}
      />
    </div>
  )
}

function HistorialTab() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Archive className="size-4 text-muted-foreground" />
          Resumen histórico
        </h2>
        {hasActiveFilters ? (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        ) : null}
      </div>

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
    </div>
  )
}

export default function CajaChicaPage() {
  return (
    <Tabs defaultValue="caja-chica" variant="pill">
      <TabsList className="bg-muted">
        <TabsTrigger value="caja-chica">Caja Chica</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
      </TabsList>

      <TabsContent value="caja-chica">
        <CajaChicaTab />
      </TabsContent>
      <TabsContent value="historial">
        <HistorialTab />
      </TabsContent>
    </Tabs>
  )
}
