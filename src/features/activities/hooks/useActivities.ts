import { useQuery } from '@tanstack/react-query'
import { fetchActivities, type FetchActivitiesParams } from './api'

export function useActivities(params: FetchActivitiesParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => fetchActivities(params),
  })
}
