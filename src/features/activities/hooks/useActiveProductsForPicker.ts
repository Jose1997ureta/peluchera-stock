import { useQuery } from '@tanstack/react-query'
import { fetchActiveProductsForPicker } from './api'

export function useActiveProductsForPicker(search: string) {
  return useQuery({
    queryKey: ['activities', 'product-picker', search],
    queryFn: () => fetchActiveProductsForPicker(search),
  })
}
