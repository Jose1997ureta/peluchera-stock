import { LOW_STOCK_THRESHOLD } from '@/shared/core/constants'
import { supabase } from '@/shared/lib/supabase'

export type DashboardMetrics = {
  salesThisMonth: number
  topActivity: { name: string; amount: number } | null
  lowStockCount: number
  lowStockProducts: { id: string; name: string; stock: number }[]
  /** Una entrada por día con ventas — fuente de la tarjeta "Ventas por período" (agrupada en el cliente). */
  salesHistory: { date: string; amount: number }[]
  topProducts: { id: string; name: string; soldQty: number }[]
  openActivities: { count: number; oldest: { name: string; daysOpen: number } | null }
  salesComparison: { currentMonth: number; previousMonth: number; percentChange: number }
  averageTicket: number | null
  inventoryValue: number
}

type ClosedActivityLine = {
  product_id: string
  unit_price: number
  sold_qty: number
}

type ClosedActivity = {
  name: string
  closed_at: string | null
  activity_products: ClosedActivityLine[]
}

type OpenActivity = {
  name: string
  created_at: string
}

function isInMonth(dateIso: string, year: number, month: number): boolean {
  const date = new Date(dateIso)
  return date.getFullYear() === year && date.getMonth() === month
}

function amountSold(activity: ClosedActivity): number {
  return activity.activity_products.reduce(
    (sum, line) => sum + line.unit_price * line.sold_qty,
    0,
  )
}

async function fetchClosedActivities(): Promise<ClosedActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('name, closed_at, activity_products(product_id, unit_price, sold_qty)')
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

async function fetchLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock')
    .eq('is_active', true)
    .lt('stock', LOW_STOCK_THRESHOLD)
    .order('stock', { ascending: true })

  if (error) throw error
  return data ?? []
}

async function fetchActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock')
    .eq('is_active', true)

  if (error) throw error
  return data ?? []
}

function computeSalesHistory(closedActivities: ClosedActivity[]): DashboardMetrics['salesHistory'] {
  const amountByDay = new Map<string, number>()
  for (const activity of closedActivities) {
    if (!activity.closed_at) continue
    const day = activity.closed_at.slice(0, 10)
    amountByDay.set(day, (amountByDay.get(day) ?? 0) + amountSold(activity))
  }

  return Array.from(amountByDay.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function computeTopProducts(
  closedActivities: ClosedActivity[],
  productNamesById: Map<string, string>,
): DashboardMetrics['topProducts'] {
  const soldQtyByProduct = new Map<string, number>()
  for (const activity of closedActivities) {
    for (const line of activity.activity_products) {
      soldQtyByProduct.set(
        line.product_id,
        (soldQtyByProduct.get(line.product_id) ?? 0) + line.sold_qty,
      )
    }
  }

  return Array.from(soldQtyByProduct.entries())
    .map(([productId, soldQty]) => ({
      id: productId,
      name: productNamesById.get(productId) ?? 'Producto eliminado',
      soldQty,
    }))
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, 5)
}

function computeOpenActivities(openActivities: OpenActivity[]): DashboardMetrics['openActivities'] {
  if (openActivities.length === 0) return { count: 0, oldest: null }

  const oldest = openActivities.reduce((a, b) =>
    new Date(a.created_at) <= new Date(b.created_at) ? a : b,
  )
  const daysOpen = Math.floor(
    (Date.now() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24),
  )

  return { count: openActivities.length, oldest: { name: oldest.name, daysOpen } }
}

function computeSalesComparison(
  closedActivities: ClosedActivity[],
): DashboardMetrics['salesComparison'] {
  const now = new Date()
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const currentMonth = closedActivities
    .filter((a) => a.closed_at && isInMonth(a.closed_at, now.getFullYear(), now.getMonth()))
    .reduce((sum, a) => sum + amountSold(a), 0)

  const previousMonth = closedActivities
    .filter(
      (a) =>
        a.closed_at &&
        isInMonth(a.closed_at, previousMonthDate.getFullYear(), previousMonthDate.getMonth()),
    )
    .reduce((sum, a) => sum + amountSold(a), 0)

  const percentChange =
    previousMonth === 0
      ? currentMonth === 0
        ? 0
        : 100
      : ((currentMonth - previousMonth) / previousMonth) * 100

  return { currentMonth, previousMonth, percentChange }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [closedActivities, openActivities, lowStockProducts, activeProducts] = await Promise.all([
    fetchClosedActivities(),
    fetchOpenActivities(),
    fetchLowStockProducts(),
    fetchActiveProducts(),
  ])

  const now = new Date()
  const salesThisMonth = closedActivities
    .filter(
      (activity) =>
        activity.closed_at !== null && isInMonth(activity.closed_at, now.getFullYear(), now.getMonth()),
    )
    .reduce((sum, activity) => sum + amountSold(activity), 0)

  const topActivity = closedActivities.length
    ? closedActivities
        .map((activity) => ({ name: activity.name, amount: amountSold(activity) }))
        .sort((a, b) => b.amount - a.amount)[0]
    : null

  const productNamesById = new Map(activeProducts.map((product) => [product.id, product.name]))
  const inventoryValue = activeProducts.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  )

  return {
    salesThisMonth,
    topActivity,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    salesHistory: computeSalesHistory(closedActivities),
    topProducts: computeTopProducts(closedActivities, productNamesById),
    openActivities: computeOpenActivities(openActivities),
    salesComparison: computeSalesComparison(closedActivities),
    averageTicket: closedActivities.length
      ? closedActivities.reduce((sum, a) => sum + amountSold(a), 0) / closedActivities.length
      : null,
    inventoryValue,
  }
}
