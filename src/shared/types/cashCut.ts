/** Caja chica: se abre con un monto inicial, acumula sola y se cierra sin campos manuales. */
export interface CashCut {
  id: string
  sequenceNumber: number
  status: 'open' | 'closed'
  initialAmount: number
  openedAt: string
  closedAt: string | null
  totalRevenue: number
  totalProfit: number
  activitiesCount: number
  activityIds: string[]
}

/**
 * Fila del "Historial de cajas": derivada en el frontend a partir de un `CashCut`, no
 * persiste en la base de datos. Cada caja aporta 1 fila (`opening`) si sigue abierta,
 * o 2 (`opening` + `closing`) si ya cerró.
 */
export interface CashCutHistoryRow {
  key: string
  cashCutId: string
  sequenceNumber: number
  kind: 'opening' | 'closing'
  amount: number
  date: string
  status: 'open' | 'closed'
  editable: boolean
}
