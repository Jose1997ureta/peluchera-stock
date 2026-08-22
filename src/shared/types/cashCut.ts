/** Caja chica: se abre con un monto inicial, acumula sola y se cierra sin campos manuales. */
export interface CashCut {
  id: string
  status: 'open' | 'closed'
  initialAmount: number
  openedAt: string
  closedAt: string | null
  totalRevenue: number
  totalProfit: number
  activitiesCount: number
  activityIds: string[]
}
