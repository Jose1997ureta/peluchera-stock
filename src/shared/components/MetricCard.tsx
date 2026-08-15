import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function MetricCard({
  title,
  icon,
  isLoading,
  isError,
  onRetry,
  children,
}: {
  title: string
  icon?: ReactNode
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : isError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-destructive">No se pudo cargar esta métrica.</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
