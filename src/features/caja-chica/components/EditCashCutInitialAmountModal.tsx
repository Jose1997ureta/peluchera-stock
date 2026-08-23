import { AnimatedBadge } from '@/shared/components/motion/animated-badge'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { formatDate } from '@/shared/utils/date'
import { OpenCashCutForm } from './OpenCashCutForm'

export interface EditCashCutInitialAmountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sequenceNumber: number
  status: 'open' | 'closed'
  openedAt: string
  activitiesCount: number
  initialAmount: number
  isPending: boolean
  onSubmit: (initialAmount: number) => void
}

/** Modal chico para corregir el monto inicial de una caja mientras sigue abierta. */
export function EditCashCutInitialAmountModal({
  open,
  onOpenChange,
  sequenceNumber,
  status,
  openedAt,
  activitiesCount,
  initialAmount,
  isPending,
  onSubmit,
}: EditCashCutInitialAmountModalProps) {
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel="Editar monto inicial"
        dismissible={!isPending}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Editar monto inicial</h2>
            <AnimatedBadge size="sm" status={status === 'open' ? 'info' : 'success'} showIcon={false}>
              {status === 'open' ? 'Abierto' : 'Cerrado'}
            </AnimatedBadge>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">N° de caja</span>
            <span className="text-right tabular-nums">{sequenceNumber}</span>
            <span className="text-muted-foreground">Fecha de apertura</span>
            <span className="text-right tabular-nums">{formatDate(openedAt)}</span>
            <span className="text-muted-foreground">Actividades cerradas</span>
            <span className="text-right tabular-nums">{activitiesCount}</span>
          </div>

          <OpenCashCutForm
            idPrefix="edit-caja"
            isPending={isPending}
            initialValue={initialAmount}
            submitLabel="Guardar"
            onSubmit={onSubmit}
          />
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
