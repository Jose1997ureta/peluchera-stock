import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Button } from '@/shared/components/ui/button'
import type { Activity } from '@/shared/types/activity'

export interface ConfirmDeleteActivityDialogProps {
  activity: Activity
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDeleteActivityDialog({
  activity,
  isPending,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteActivityDialogProps) {
  return (
    <CenterMorphModal open onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Eliminar actividad" dismissible={!isPending}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Eliminar actividad</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ¿Confirmás eliminar &quot;{activity.name}&quot;?
            {activity.status === 'open'
              ? ' El stock reservado de sus productos se devuelve al eliminarla.'
              : ''}
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
              Eliminar
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
