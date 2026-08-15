import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ActivityInput } from './api'
import { updateActivity } from './api'

export function useUpdateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActivityInput }) => updateActivity(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
