export type ActivityStatus = 'open' | 'closed'

export interface ActivityProductLine {
  id: string
  productId: string
  unitPrice: number
  initialQty: number
  soldQty: number
}

export interface Activity {
  id: string
  name: string
  /** Id de la zona donde se realiza la actividad — ver `ZONE_OPTIONS` en `activity.schema.ts`. */
  zonaId: number
  status: ActivityStatus
  createdAt: string
  closedAt: string | null
  /** Ingresos reales generados por la actividad, ingresados a mano al cerrarla (Rellenar). `null` mientras está abierta. */
  revenue: number | null
  /** Id del corte de Caja Chica que incluyó esta actividad cerrada. `null` mientras no pertenece a ningún corte (actividades abiertas siempre son `null`). */
  cutId: string | null
  products: ActivityProductLine[]
}
