import { supabase } from '@/shared/lib/supabase'
import type { CashCut } from '@/shared/types/cashCut'
import type { Tables } from '@/shared/types/supabase'

export interface CurrentCashCut {
  id: string
  initialAmount: number
  openedAt: string
  totalRevenue: number
  totalProfit: number
  activitiesCount: number
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

interface ClosedActivityRow {
  closed_at: string | null
  revenue: number | null
  activity_products: { unit_price: number; sold_qty: number }[]
}

/** Valor a precio de catálogo de lo efectivamente vendido en una actividad — lo que se registra como "caja". */
function subtotalRealOf(activity: ClosedActivityRow): number {
  return activity.activity_products.reduce((sum, line) => sum + line.unit_price * line.sold_qty, 0)
}

function toCashCut(row: CashCutRow): CashCut {
  return {
    id: row.id,
    status: row.status as CashCut['status'],
    initialAmount: row.initial_amount,
    openedAt: row.opened_at ?? row.closed_at ?? '',
    closedAt: row.closed_at,
    totalRevenue: row.total_revenue,
    totalProfit: row.total_profit,
    activitiesCount: row.activities_count,
    activityIds: row.activity_ids,
  }
}

/**
 * Estado de la caja abierta actual, o `null` si no hay ninguna. A diferencia de un corte
 * histórico, el subtotal real/ganancia se recalculan en vivo sobre las actividades ya
 * atadas a esta caja (`cut_id`), porque todavía no se fijaron con "Cerrar caja".
 */
export async function fetchCurrentCashCut(): Promise<CurrentCashCut | null> {
  const { data: cut, error } = await supabase
    .from('cash_cuts')
    .select('*')
    .eq('status', 'open')
    .maybeSingle()

  if (error) throw error
  if (!cut) return null

  const { data, error: activitiesError } = await supabase
    .from('activities')
    .select('closed_at, revenue, activity_products(unit_price, sold_qty)')
    .eq('cut_id', cut.id)

  if (activitiesError) throw activitiesError
  const activities = (data ?? []) as unknown as ClosedActivityRow[]

  const totalRevenue = activities.reduce((sum, activity) => sum + subtotalRealOf(activity), 0)
  const totalProfit = activities.reduce(
    (sum, activity) => sum + ((activity.revenue ?? 0) - subtotalRealOf(activity)),
    0,
  )

  return {
    id: cut.id,
    initialAmount: cut.initial_amount,
    openedAt: cut.opened_at ?? '',
    totalRevenue,
    totalProfit,
    activitiesCount: activities.length,
  }
}

/**
 * Resumen histórico de Inversión/Ganancia sobre TODAS las actividades cerradas (pertenezcan o no
 * a una caja ya cerrada), filtrable por rango de fecha (`closed_at`) y/o zona — a diferencia de
 * la caja actual, que solo mira las atadas a ella (spec/caja-chica/caja-chica-feature.md).
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
  const activities = (data ?? []) as unknown as ClosedActivityRow[]

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
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toCashCut)
}

/** Abre una caja nueva con el monto inicial ingresado — falla si ya hay una caja abierta. */
export async function openCashCut(initialAmount: number): Promise<void> {
  const { error } = await supabase.rpc('open_cash_cut', { p_initial_amount: initialAmount })
  if (error) throw error
}

/**
 * Cierra la caja abierta actual (irreversible): fija el subtotal real y la ganancia
 * acumulados por las actividades atadas a ella como un registro histórico. No recibe
 * ningún monto de cierre — todo ya se calculó al ir cerrando actividades. Corre
 * atómicamente en la función `close_cash_cut` de Postgres.
 */
export async function closeCashCut(): Promise<CashCut> {
  const { data: cutId, error } = await supabase.rpc('close_cash_cut')
  if (error) throw error

  const { data, error: fetchError } = await supabase
    .from('cash_cuts')
    .select('*')
    .eq('id', cutId)
    .single()

  if (fetchError) throw fetchError
  return toCashCut(data)
}
