import { useQuery } from '@tanstack/react-query'
import { fetchHistoricalSummary, type HistoricalSummaryFilters } from './api'

export function useHistoricalSummary(filters: HistoricalSummaryFilters) {
  return useQuery({
    queryKey: ['caja-chica-resumen', filters],
    queryFn: () => fetchHistoricalSummary(filters),
  })
}
