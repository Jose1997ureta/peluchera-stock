import { useQuery } from '@tanstack/react-query'
import { fetchProductsByIds } from './api'

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['activities', 'products-by-ids', [...ids].sort()],
    queryFn: () => fetchProductsByIds(ids),
    enabled: ids.length > 0,
  })
}
