import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ActivitySoldLineInput } from './api'
import { closeActivity } from './api'

export function useCloseActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      revenue,
      soldLines,
    }: {
      id: string
      revenue: number
      soldLines: ActivitySoldLineInput[]
    }) => closeActivity(id, revenue, soldLines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
