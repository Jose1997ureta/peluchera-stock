import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProduct } from './api'

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
