import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ActivitiesPage from '../features/activities/components/ActivitiesPage'
import LoginPage from '../features/auth/components/LoginPage'
import RegisterPage from '../features/auth/components/RegisterPage'
import CajaChicaPage from '../features/caja-chica/components/CajaChicaPage'
import ProductsPage from '../features/products/components/ProductsPage'
import ProfilePage from '../features/profile/components/ProfilePage'
import { AppLayout } from './AppLayout'
import { AuthGuard } from './AuthGuard'

// Carga diferida: DashboardPage importa el cliente de Supabase (src/shared/lib/supabase.ts),
// que revienta en el import si faltan las variables de entorno. Con lazy(), ese import solo
// se evalúa al entrar a "/", sin romper el resto de la app (ej. /login) mientras no haya .env.
const DashboardPage = lazy(() => import('../features/dashboard/components/DashboardPage'))

// Rutas placeholder: cada página real se implementará a partir de su spec
// en spec/<feature>/. No agregar lógica de negocio aquí salvo lo ya definido
// en spec/auth/login-feature.md y spec/dashboard/dashboard-feature.md
// (rutas públicas vs. protegidas, shell de navegación).
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={null}>
            <DashboardPage />
          </Suspense>
        ),
        errorElement: (
          <p className="text-sm text-destructive">
            No se pudo cargar el dashboard. Revisá que las variables de entorno de Supabase
            (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) estén configuradas.
          </p>
        ),
      },
      { path: 'productos', element: <ProductsPage /> },
      { path: 'actividades', element: <ActivitiesPage /> },
      { path: 'caja-chica', element: <CajaChicaPage /> },
      { path: 'perfil', element: <ProfilePage /> },
    ],
  },
])
