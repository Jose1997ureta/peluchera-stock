import { supabase } from '@/shared/lib/supabase'

export type DashboardMetrics = {
  /** Una entrada por día con inversión — fuente de la tarjeta "Inversión por período" (agrupada en el cliente). */
  investmentHistory: { date: string; amount: number }[]
  /** Una entrada por día con ganancia — fuente de la tarjeta "Ganancia por período" (agrupada en el cliente). */
  profitHistory: { date: string; amount: number }[]
  /** Una entrada por día con cantidad de actividades cerradas ese día — fuente de "Actividades por período". */
  activitiesHistory: { date: string; amount: number }[]
  openActivities: { count: number; oldest: { name: string; daysOpen: number } | null }
  investmentComparison: { currentMonth: number; previousMonth: number; percentChange: number }
  /** Σ inversión / Σ ganancia de TODAS las actividades cerradas, sin filtro de mes. */
  allTime: { investment: number; profit: number }
  /** `allTime.profit / allTime.investment * 100` — `0` si no hay inversión todavía. */
  averageMarginPercent: number
  /** Ranking de ganancia por zona en el mes en curso, de mayor a menor, máx. 5. */
  zoneRanking: { zonaId: number; zoneName: string; profit: number }[]
}

type ClosedActivityLine = {
  unit_price: number
  sold_qty: number
}

type ClosedActivity = {
  closed_at: string | null
  revenue: number | null
  zona_id: number
  activity_products: ClosedActivityLine[]
}

type OpenActivity = {
  name: string
  created_at: string
}

type Zona = {
  id: number
  name: string
}

function isInMonth(dateIso: string, year: number, month: number): boolean {
  const date = new Date(dateIso)
  return date.getFullYear() === year && date.getMonth() === month
}

/** Precio de catálogo de lo vendido en la actividad — lo que el negocio llama "Inversión". */
function investmentOf(activity: ClosedActivity): number {
  return activity.activity_products.reduce(
    (sum, line) => sum + line.unit_price * line.sold_qty,
    0,
  )
}

/** Ganancia neta real de la actividad: lo que efectivamente entró (`revenue`) menos la inversión. */
function profitOf(activity: ClosedActivity): number {
  return (activity.revenue ?? 0) - investmentOf(activity)
}

async function fetchClosedActivities(): Promise<ClosedActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('closed_at, revenue, zona_id, activity_products(unit_price, sold_qty)')
    .eq('status', 'closed')

  if (error) throw error
  return data ?? []
}

async function fetchOpenActivities(): Promise<OpenActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('name, created_at')
    .eq('status', 'open')

  if (error) throw error
  return data ?? []
}

async function fetchZonas(): Promise<Zona[]> {
  const { data, error } = await supabase.from('zonas').select('id, name')
  if (error) throw error
  return data ?? []
}

function computeHistory(
  closedActivities: ClosedActivity[],
  valueOf: (activity: ClosedActivity) => number,
): { date: string; amount: number }[] {
  const amountByDay = new Map<string, number>()
  for (const activity of closedActivities) {
    if (!activity.closed_at) continue
    const day = activity.closed_at.slice(0, 10)
    amountByDay.set(day, (amountByDay.get(day) ?? 0) + valueOf(activity))
  }

  return Array.from(amountByDay.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function computeOpenActivities(openActivities: OpenActivity[]): DashboardMetrics['openActivities'] {
  if (openActivities.length === 0) return { count: 0, oldest: null }

  const oldest = openActivities.reduce((a, b) =>
    new Date(a.created_at) <= new Date(b.created_at) ? a : b,
  )
  const daysOpen = Math.max(
    0,
    Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  )

  return { count: openActivities.length, oldest: { name: oldest.name, daysOpen } }
}

function computeInvestmentComparison(
  closedActivities: ClosedActivity[],
): DashboardMetrics['investmentComparison'] {
  const now = new Date()
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const currentMonth = closedActivities
    .filter((a) => a.closed_at && isInMonth(a.closed_at, now.getFullYear(), now.getMonth()))
    .reduce((sum, a) => sum + investmentOf(a), 0)

  const previousMonth = closedActivities
    .filter(
      (a) =>
        a.closed_at &&
        isInMonth(a.closed_at, previousMonthDate.getFullYear(), previousMonthDate.getMonth()),
    )
    .reduce((sum, a) => sum + investmentOf(a), 0)

  const percentChange =
    previousMonth === 0
      ? currentMonth === 0
        ? 0
        : 100
      : ((currentMonth - previousMonth) / previousMonth) * 100

  return { currentMonth, previousMonth, percentChange }
}

function computeZoneRanking(
  closedActivities: ClosedActivity[],
  zonaNamesById: Map<number, string>,
): DashboardMetrics['zoneRanking'] {
  const now = new Date()
  const profitByZone = new Map<number, number>()

  for (const activity of closedActivities) {
    if (!activity.closed_at || !isInMonth(activity.closed_at, now.getFullYear(), now.getMonth())) {
      continue
    }
    profitByZone.set(activity.zona_id, (profitByZone.get(activity.zona_id) ?? 0) + profitOf(activity))
  }

  return Array.from(profitByZone.entries())
    .map(([zonaId, profit]) => ({
      zonaId,
      zoneName: zonaNamesById.get(zonaId) ?? 'Zona eliminada',
      profit,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [closedActivities, openActivities, zonas] = await Promise.all([
    fetchClosedActivities(),
    fetchOpenActivities(),
    fetchZonas(),
  ])

  const zonaNamesById = new Map(zonas.map((zona) => [zona.id, zona.name]))
  const allTimeInvestment = closedActivities.reduce((sum, a) => sum + investmentOf(a), 0)
  const allTimeProfit = closedActivities.reduce((sum, a) => sum + profitOf(a), 0)

  return {
    investmentHistory: computeHistory(closedActivities, investmentOf),
    profitHistory: computeHistory(closedActivities, profitOf),
    activitiesHistory: computeHistory(closedActivities, () => 1),
    openActivities: computeOpenActivities(openActivities),
    investmentComparison: computeInvestmentComparison(closedActivities),
    allTime: { investment: allTimeInvestment, profit: allTimeProfit },
    averageMarginPercent: allTimeInvestment === 0 ? 0 : (allTimeProfit / allTimeInvestment) * 100,
    zoneRanking: computeZoneRanking(closedActivities, zonaNamesById),
  }
}
