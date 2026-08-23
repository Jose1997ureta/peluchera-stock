import { useQuery } from '@tanstack/react-query'
import { fetchClosedActivitiesForImport } from './api'

export function useClosedActivitiesForImport(search: string) {
  return useQuery({
    queryKey: ['activities', 'closed-for-import', search],
    queryFn: () => fetchClosedActivitiesForImport(search),
  })
}
