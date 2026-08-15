import { ChevronDown, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/motion/popover'

export interface BulkActionsMenuProps {
  selectedCount: number
  isActiveTab: boolean
  onToggleActive: () => void
  onDelete: () => void
}

export function BulkActionsMenu({
  selectedCount,
  isActiveTab,
  onToggleActive,
  onDelete,
}: BulkActionsMenuProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
      </span>

      <Popover side="bottom" align="end">
        <PopoverTrigger>
          <Button size="sm" variant="outline">
            Acciones
            <ChevronDown className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1.5">
          <button
            type="button"
            onClick={onToggleActive}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            {isActiveTab ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {isActiveTab ? 'Desactivar seleccionados' : 'Activar seleccionados'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            Eliminar seleccionados
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
