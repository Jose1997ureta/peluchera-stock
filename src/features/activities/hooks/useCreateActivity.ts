import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActivity } from './api'

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
