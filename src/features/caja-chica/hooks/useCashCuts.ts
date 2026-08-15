import { useQuery } from '@tanstack/react-query'
import { fetchCashCuts } from './api'

export function useCashCuts() {
  return useQuery({
    queryKey: ['cash-cuts', 'history'],
    queryFn: fetchCashCuts,
  })
}
