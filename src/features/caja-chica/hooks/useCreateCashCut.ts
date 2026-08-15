import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCashCut } from './api'

export function useCreateCashCut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCashCut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-cuts'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
