import { supabase } from '@/shared/lib/supabase'
import type { Activity, ActivityProductLine, ActivityStatus } from '@/shared/types/activity'
import type { Product } from '@/shared/types/product'
import type { Tables } from '@/shared/types/supabase'

export type ActivitySortKey = 'name' | 'createdAt' | 'estimatedAmount' | 'soldAmount'
export type ActivitySortDirection = 'asc' | 'desc'

export interface FetchActivitiesParams {
  status: 'open' | 'closed'
  search: string
  zonaId: number | null
  sortKey: ActivitySortKey
  sortDirection: ActivitySortDirection
  page: number
  pageSize: number
}

export interface FetchActivitiesResult {
  items: Activity[]
  total: number
}

export interface ActivityLineInput {
  productId: string
  unitPrice: number
  initialQty: number
}

export interface ActivityInput {
  name: string
  zonaId: number
  products: ActivityLineInput[]
}

export interface ActivitySoldLineInput {
  productId: string
  soldQty: number
}

export interface Zona {
  id: number
  name: string
}

export async function fetchZonas(): Promise<Zona[]> {
  const { data, error } = await supabase.from('zonas').select('id, name').order('name')
  if (error) throw error
  return data ?? []
}

type ActivityRow = Tables<'activities'> & {
  activity_products: Tables<'activity_products'>[]
}
type ProductRow = Tables<'products'>

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toLine(row: Tables<'activity_products'>): ActivityProductLine {
  return {
    id: row.id,
    productId: row.product_id,
    unitPrice: row.unit_price,
    initialQty: row.initial_qty,
    soldQty: row.sold_qty,
  }
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    zonaId: row.zona_id,
    status: row.status as ActivityStatus,
    createdAt: row.created_at,
    closedAt: row.closed_at,
    revenue: row.revenue,
    cutId: row.cut_id,
    products: (row.activity_products ?? []).map(toLine),
  }
}

function amountOf(products: ActivityProductLine[], qtyKey: 'initialQty' | 'soldQty'): number {
  return products.reduce((sum, line) => sum + line.unitPrice * line[qtyKey], 0)
}

async function fetchActivityById(id: string): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, activity_products(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return toActivity(data as unknown as ActivityRow)
}

/** Mapea cada línea existente de la actividad a su id (activity_products.id) por product_id — usado para armar el payload de las RPC de editar/cerrar, que necesitan referenciar la fila exacta. */
async function fetchLineIdsByProductId(activityId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('activity_products')
    .select('id, product_id')
    .eq('activity_id', activityId)

  if (error) throw error
  return new Map((data ?? []).map((line) => [line.product_id, line.id]))
}

export async function fetchActivities(params: FetchActivitiesParams): Promise<FetchActivitiesResult> {
  let query = supabase
    .from('activities')
    .select('*, activity_products(*)')
    .eq('status', params.status)

  const normalizedSearch = params.search.trim()
  if (normalizedSearch) {
    query = query.ilike('name', `%${normalizedSearch}%`)
  }

  if (params.zonaId !== null) {
    query = query.eq('zona_id', params.zonaId)
  }

  const { data, error } = await query
  if (error) throw error

  const activities = (data as unknown as ActivityRow[]).map(toActivity)

  const sortValue = (activity: Activity): string | number => {
    switch (params.sortKey) {
      case 'name':
        return activity.name
      case 'createdAt':
        return activity.createdAt
      case 'estimatedAmount':
        return amountOf(activity.products, 'initialQty')
      case 'soldAmount':
        return amountOf(activity.products, 'soldQty')
    }
  }

  const sorted = [...activities].sort((a, b) => {
    const aValue = sortValue(a)
    const bValue = sortValue(b)
    const comparison =
      typeof aValue === 'string' ? aValue.localeCompare(bValue as string) : aValue - (bValue as number)
    return params.sortDirection === 'asc' ? comparison : -comparison
  })

  const start = (params.page - 1) * params.pageSize
  const items = sorted.slice(start, start + params.pageSize)

  return { items, total: sorted.length }
}

/** Productos activos que se pueden buscar/agregar desde el picker del formulario de actividad. */
export async function fetchActiveProductsForPicker(search: string): Promise<Product[]> {
  let query = supabase.from('products').select('*').eq('is_active', true).limit(20)

  const normalizedSearch = search.trim()
  if (normalizedSearch) {
    query = query.ilike('name', `%${normalizedSearch}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toProduct)
}

/** Productos por id, activos o no — usado para mostrar/editar líneas ya agregadas a una actividad, aunque el producto se haya desactivado después. */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase.from('products').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []).map(toProduct)
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const { data: activityId, error } = await supabase.rpc('create_activity', {
    p_name: input.name,
    p_zona_id: input.zonaId,
    p_lines: input.products.map((line) => ({
      product_id: line.productId,
      initial_qty: line.initialQty,
    })),
  })

  if (error) throw error
  return fetchActivityById(activityId)
}

export async function updateActivity(id: string, input: ActivityInput): Promise<Activity> {
  const lineIdByProductId = await fetchLineIdsByProductId(id)

  const { error } = await supabase.rpc('update_activity', {
    p_activity_id: id,
    p_name: input.name,
    p_zona_id: input.zonaId,
    p_lines: input.products.map((line) => ({
      line_id: lineIdByProductId.get(line.productId) ?? null,
      product_id: line.productId,
      initial_qty: line.initialQty,
    })),
  })

  if (error) throw error
  return fetchActivityById(id)
}

/**
 * Cierre de actividad (irreversible): registra lo realmente vendido de cada línea y los
 * ingresos reales de la actividad (`revenue`, ingresado a mano), descuenta del stock
 * exactamente `soldQty` (no `initialQty`) y pasa la actividad a 'closed'.
 * Toda la lógica corre atómicamente en la función `close_activity` de Postgres.
 */
export async function closeActivity(
  id: string,
  revenue: number,
  soldLines: ActivitySoldLineInput[],
): Promise<Activity> {
  const lineIdByProductId = await fetchLineIdsByProductId(id)

  const { error } = await supabase.rpc('close_activity', {
    p_activity_id: id,
    p_revenue: revenue,
    p_sold_lines: soldLines.map((line) => ({
      line_id: lineIdByProductId.get(line.productId),
      sold_qty: line.soldQty,
    })),
  })

  if (error) throw error
  return fetchActivityById(id)
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_activity', { p_activity_id: id })
  if (error) throw error
}
