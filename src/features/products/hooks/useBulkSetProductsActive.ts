import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkSetProductsActive } from './api'

export function useBulkSetProductsActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      bulkSetProductsActive(ids, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
