import { useQuery } from '@tanstack/react-query'
import { fetchCurrentCut } from './api'

export function useCurrentCut() {
  return useQuery({
    queryKey: ['cash-cuts', 'current'],
    queryFn: fetchCurrentCut,
  })
}
