import { CalendarCheck, ChevronRight, LayoutDashboard, PanelLeft, Package, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
} from '@/shared/components/motion/animated-sidebar'
import { useAuth } from '@/shared/context/AuthContext'

const SIDEBAR_STATE_STORAGE_KEY = 'peluchera_stock_sidebar_state'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Productos', to: '/productos', icon: Package },
  { label: 'Actividades', to: '/actividades', icon: CalendarCheck },
  { label: 'Caja Chica', to: '/caja-chica', icon: Wallet },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/productos': 'Productos',
  '/actividades': 'Actividades',
  '/caja-chica': 'Caja Chica',
  '/perfil': 'Perfil',
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Peluchera Stock'
}

function readStoredSidebarOpen(): boolean {
  const stored = window.localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY)
  return stored === null ? true : stored === 'expanded'
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(readStoredSidebarOpen)

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STATE_STORAGE_KEY,
      open ? 'expanded' : 'collapsed',
    )
  }, [open])

  return (
    <AnimatedSidebarProvider open={open} onOpenChange={setOpen} className="min-h-svh">
      <AnimatedSidebar ariaLabel="Navegación principal" collapsible="icon">
        <AnimatedSidebarHeader className="p-3 pb-2">
          <div className="flex min-h-11 items-center gap-2 overflow-hidden px-2">
            <img src="/icons/icon-192.png" alt="" className="size-6 shrink-0 rounded-md" />
            <span className="truncate text-sm font-semibold text-foreground group-data-[state=collapsed]/sidebar:hidden">
              Peluchera Stock
            </span>
          </div>
        </AnimatedSidebarHeader>

        <AnimatedSidebarContent className="px-2 pt-1">
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                  <AnimatedSidebarMenuItem key={to}>
                    <AnimatedSidebarMenuButton
                      icon={<Icon className="size-4" />}
                      isActive={location.pathname === to}
                      onSelect={() => navigate(to)}
                    >
                      {label}
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                ))}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>

        <AnimatedSidebarFooter className="gap-3 border-none p-3">
          {user ? (
            <button
              type="button"
              onClick={() => navigate('/perfil')}
              aria-current={location.pathname === '/perfil' ? 'page' : undefined}
              className="flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  getInitials(user.nombre, user.apellido)
                )}
              </span>
              <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                <span className="block truncate text-sm font-medium text-foreground">
                  {user.nombre} {user.apellido}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{user.correo}</span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground group-data-[state=collapsed]/sidebar:hidden"
              />
            </button>
          ) : null}
        </AnimatedSidebarFooter>

        <AnimatedSidebarRail />
      </AnimatedSidebar>

      <AnimatedSidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <AnimatedSidebarTrigger className="text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <PanelLeft aria-hidden="true" className="size-4" />
          </AnimatedSidebarTrigger>
          <div className="h-5 w-px bg-border" />
          <p className="text-sm font-medium text-foreground">{getPageTitle(location.pathname)}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  )
}
