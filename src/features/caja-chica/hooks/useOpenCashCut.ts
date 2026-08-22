import { useMutation, useQueryClient } from '@tanstack/react-query'
import { openCashCut } from './api'

export function useOpenCashCut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: openCashCut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-cuts'] })
    },
  })
}
