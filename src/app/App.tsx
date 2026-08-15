import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '../shared/components/ui/toaster'
import { AuthProvider } from '../shared/context/AuthContext'
import { ThemeProvider } from '../shared/context/ThemeContext'
import { queryClient } from '../shared/lib/queryClient'
import { router } from './routes'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
