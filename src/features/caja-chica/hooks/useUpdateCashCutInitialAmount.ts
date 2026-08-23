import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCashCutInitialAmount } from './api'

export function useUpdateCashCutInitialAmount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCashCutInitialAmount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-cuts'] })
    },
  })
}
