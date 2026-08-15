/** Registro histórico de un corte de Caja Chica: archiva el período acumulado hasta ese momento. */
export interface CashCut {
  id: string
  closedAt: string
  totalRevenue: number
  totalProfit: number
  activitiesCount: number
  activityIds: string[]
}
