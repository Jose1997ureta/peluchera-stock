import { useQuery } from '@tanstack/react-query'
import { fetchZonas } from './api'

export function useZonas() {
  return useQuery({
    queryKey: ['zonas'],
    queryFn: fetchZonas,
    staleTime: 5 * 60 * 1000,
  })
}
