import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductInput } from './api'
import { updateProduct } from './api'

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
