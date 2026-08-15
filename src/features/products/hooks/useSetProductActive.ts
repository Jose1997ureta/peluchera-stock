import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setProductActive } from './api'

export function useSetProductActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setProductActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
