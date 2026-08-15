import { supabase } from '@/shared/lib/supabase'
import type { CashCut } from '@/shared/types/cashCut'
import type { Tables } from '@/shared/types/supabase'

export interface CurrentCut {
  totalRevenue: number
  totalProfit: number
  activitiesCount: number
  /** Actividad cerrada más antigua todavía pendiente de corte, o `null` si no hay ninguna — se usa como "desde cuándo" se viene acumulando. */
  since: string | null
}

export interface HistoricalSummaryFilters {
  /** Fecha "desde" (inclusive) sobre `closed_at`, formato `YYYY-MM-DD`, o `null` sin límite inferior. */
  dateFrom: string | null
  /** Fecha "hasta" (inclusive) sobre `closed_at`, formato `YYYY-MM-DD`, o `null` sin límite superior. */
  dateTo: string | null
  zonaId: number | null
}

export interface HistoricalSummary {
  totalInvested: number
  totalProfit: number
  activitiesCount: number
}

type CashCutRow = Tables<'cash_cuts'>

interface PendingActivityRow {
  closed_at: string | null
  revenue: number | null
  activity_products: { unit_price: number; sold_qty: number }[]
}

/** Valor a precio de catálogo de lo efectivamente vendido en una actividad — lo que se registra como "caja". */
function subtotalRealOf(activity: PendingActivityRow): number {
  return activity.activity_products.reduce((sum, line) => sum + line.unit_price * line.sold_qty, 0)
}

function toCashCut(row: CashCutRow): CashCut {
  return {
    id: row.id,
    closedAt: row.closed_at,
    totalRevenue: row.total_revenue,
    totalProfit: row.total_profit,
    activitiesCount: row.activities_count,
    activityIds: row.activity_ids,
  }
}

async function fetchPendingClosedActivities(): Promise<PendingActivityRow[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('closed_at, revenue, activity_products(unit_price, sold_qty)')
    .eq('status', 'closed')
    .is('cut_id', null)

  if (error) throw error
  return (data ?? []) as unknown as PendingActivityRow[]
}

export async function fetchCurrentCut(): Promise<CurrentCut> {
  const pending = await fetchPendingClosedActivities()

  const totalRevenue = pending.reduce((sum, activity) => sum + subtotalRealOf(activity), 0)
  const totalProfit = pending.reduce(
    (sum, activity) => sum + ((activity.revenue ?? 0) - subtotalRealOf(activity)),
    0,
  )
  const since = pending.reduce<string | null>((earliest, activity) => {
    if (!activity.closed_at) return earliest
    if (!earliest || activity.closed_at < earliest) return activity.closed_at
    return earliest
  }, null)

  return {
    totalRevenue,
    totalProfit,
    activitiesCount: pending.length,
    since,
  }
}

/**
 * Resumen histórico de Inversión/Ganancia sobre TODAS las actividades cerradas (pertenezcan o no
 * ya a un corte pasado), filtrable por rango de fecha (`closed_at`) y/o zona — a diferencia de
 * "Corte actual", que solo mira las pendientes de corte (spec/caja-chica/caja-chica-feature.md).
 */
export async function fetchHistoricalSummary(
  filters: HistoricalSummaryFilters,
): Promise<HistoricalSummary> {
  let query = supabase
    .from('activities')
    .select('revenue, activity_products(unit_price, sold_qty)')
    .eq('status', 'closed')

  if (filters.dateFrom) {
    query = query.gte('closed_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('closed_at', `${filters.dateTo}T23:59:59.999`)
  }
  if (filters.zonaId !== null) {
    query = query.eq('zona_id', filters.zonaId)
  }

  const { data, error } = await query
  if (error) throw error
  const activities = (data ?? []) as unknown as PendingActivityRow[]

  const totalInvested = activities.reduce((sum, activity) => sum + subtotalRealOf(activity), 0)
  const totalProfit = activities.reduce(
    (sum, activity) => sum + ((activity.revenue ?? 0) - subtotalRealOf(activity)),
    0,
  )

  return {
    totalInvested,
    totalProfit,
    activitiesCount: activities.length,
  }
}

export async function fetchCashCuts(): Promise<CashCut[]> {
  const { data, error } = await supabase
    .from('cash_cuts')
    .select('*')
    .order('closed_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toCashCut)
}

/**
 * Ejecuta un corte (irreversible): archiva los totales acumulados de las actividades cerradas
 * pendientes como un registro histórico y las marca con el `cutId` del nuevo corte, para que
 * el acumulado actual vuelva a $0 (spec/caja-chica/caja-chica-feature.md). Corre atómicamente
 * en la función `create_cash_cut` de Postgres.
 */
export async function createCashCut(): Promise<CashCut> {
  const { data: cutId, error } = await supabase.rpc('create_cash_cut')
  if (error) throw error

  const { data, error: fetchError } = await supabase
    .from('cash_cuts')
    .select('*')
    .eq('id', cutId)
    .single()

  if (fetchError) throw fetchError
  return toCashCut(data)
}
