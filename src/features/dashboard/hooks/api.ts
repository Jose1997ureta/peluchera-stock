import { LOW_STOCK_THRESHOLD } from '@/shared/core/constants'
import { supabase } from '@/shared/lib/supabase'

export type DashboardMetrics = {
  salesThisMonth: number
  topActivity: { name: string; amount: number } | null
  lowStockCount: number
  lowStockProducts: { id: string; name: string; stock: number }[]
}

type ClosedActivityLine = {
  unit_price: number
  sold_qty: number
}

type ClosedActivity = {
  name: string
  closed_at: string | null
  activity_products: ClosedActivityLine[]
}

function isInCurrentMonth(dateIso: string): boolean {
  const date = new Date(dateIso)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
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
    .select('name, closed_at, activity_products(unit_price, sold_qty)')
    .eq('status', 'closed')

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

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [closedActivities, lowStockProducts] = await Promise.all([
    fetchClosedActivities(),
    fetchLowStockProducts(),
  ])

  const salesThisMonth = closedActivities
    .filter((activity) => activity.closed_at !== null && isInCurrentMonth(activity.closed_at))
    .reduce((sum, activity) => sum + amountSold(activity), 0)

  const topActivity = closedActivities.length
    ? closedActivities
        .map((activity) => ({ name: activity.name, amount: amountSold(activity) }))
        .sort((a, b) => b.amount - a.amount)[0]
    : null

  return {
    salesThisMonth,
    topActivity,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
  }
}
