import { useMutation, useQueryClient } from '@tanstack/react-query'
import { closeCashCut } from './api'

export function useCloseCashCut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeCashCut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-cuts'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
