import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { Button } from '@/shared/components/ui/button'

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  isDestructive?: boolean
  isPending: boolean
  onConfirm: () => void
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  isPending,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={title} dismissible={!isPending}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'default'}
              disabled={isPending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
