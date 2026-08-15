import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Mientras se hidrata la sesión de Supabase Auth no redirigimos todavía,
  // para no mandar a /login a un usuario que en realidad sigue logueado.
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
