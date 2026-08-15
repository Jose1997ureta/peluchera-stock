import { supabase } from '@/shared/lib/supabase'
import type { Tables } from '@/shared/types/supabase'
import type { Product } from '@/shared/types/product'
import { compressImage } from '@/shared/utils/image'

const PRODUCT_IMAGES_BUCKET = 'product-images'
const PRODUCT_IMAGE_MAX_DIMENSION = 1600

export type ProductSortKey = 'name' | 'price' | 'stock'
export type ProductSortDirection = 'asc' | 'desc'

export interface FetchProductsParams {
  isActive: boolean
  search: string
  sortKey: ProductSortKey
  sortDirection: ProductSortDirection
  page: number
  pageSize: number
}

export interface FetchProductsResult {
  items: Product[]
  total: number
}

export interface ProductInput {
  name: string
  description: string
  price: number
  stock: number
  image: File | null
  existingImageUrl: string | null
}

type ProductRow = Tables<'products'>

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function uploadProductImage(file: File): Promise<string> {
  const compressed = await compressImage(file, { maxDimension: PRODUCT_IMAGE_MAX_DIMENSION })
  const path = `${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, compressed)
  if (error) throw error

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function fetchProducts(params: FetchProductsParams): Promise<FetchProductsResult> {
  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', params.isActive)
    .order(params.sortKey, { ascending: params.sortDirection === 'asc' })
    .range(from, to)

  const normalizedSearch = params.search.trim()
  if (normalizedSearch) {
    query = query.ilike('name', `%${normalizedSearch}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return { items: (data ?? []).map(toProduct), total: count ?? 0 }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const imageUrl = input.image ? await uploadProductImage(input.image) : input.existingImageUrl

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      description: input.description || null,
      price: input.price,
      stock: input.stock,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (error) throw error
  return toProduct(data)
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const imageUrl = input.image ? await uploadProductImage(input.image) : input.existingImageUrl

  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      description: input.description || null,
      price: input.price,
      stock: input.stock,
      image_url: imageUrl,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toProduct(data)
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) throw error
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}

export async function bulkSetProductsActive(ids: string[], isActive: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_active: isActive }).in('id', ids)
  if (error) throw error
}
