import { useQuery } from '@tanstack/react-query'
import { fetchClosedActivityLeftoverLines } from './api'

export function useClosedActivityLeftoverLines(activityId: string | null) {
  return useQuery({
    queryKey: ['activities', 'closed-leftover-lines', activityId],
    queryFn: () => fetchClosedActivityLeftoverLines(activityId as string),
    enabled: activityId !== null,
  })
}
