import { useQuery } from '@tanstack/react-query'
import { fetchCurrentCashCut } from './api'

export function useCurrentCashCut() {
  return useQuery({
    queryKey: ['cash-cuts', 'current'],
    queryFn: fetchCurrentCashCut,
  })
}
