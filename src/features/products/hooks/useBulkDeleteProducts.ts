import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkDeleteProducts } from './api'

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkDeleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
