import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/motion/tabs'
import { toast } from '@/shared/lib/toast'
import type { Activity } from '@/shared/types/activity'
import { useDeleteActivity } from '../hooks/useDeleteActivity'
import { ActivitiesTabPanel } from './ActivitiesTabPanel'
import { ActivityFillModal } from './ActivityFillModal'
import { ActivityFormModal, type ActivityFormModalMode } from './ActivityFormModal'
import { ConfirmDeleteActivityDialog } from './ConfirmDeleteActivityDialog'

type FormModalState = { activity: Activity | null; mode: ActivityFormModalMode }

export default function ActivitiesPage() {
  const [formModal, setFormModal] = useState<FormModalState | null>(null)
  const [fillTarget, setFillTarget] = useState<Activity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)

  const deleteActivity = useDeleteActivity()

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    try {
      await deleteActivity.mutateAsync(deleteTarget.id)
      toast.success('Actividad eliminada.')
      setDeleteTarget(null)
    } catch {
      toast.error('No se pudo eliminar la actividad. Intentá de nuevo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="open" variant="pill">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="open">Abiertas</TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
          </TabsList>

          <Button onClick={() => setFormModal({ activity: null, mode: 'create' })}>
            <Plus className="size-4" />
            Crear actividad
          </Button>
        </div>

        <TabsContent value="open">
          <ActivitiesTabPanel
            isOpenTab
            onEdit={(activity) => setFormModal({ activity, mode: 'edit' })}
            onView={(activity) => setFormModal({ activity, mode: 'view' })}
            onFill={setFillTarget}
            onRequestDelete={setDeleteTarget}
            onCreateActivity={() => setFormModal({ activity: null, mode: 'create' })}
          />
        </TabsContent>
        <TabsContent value="closed">
          <ActivitiesTabPanel
            isOpenTab={false}
            onEdit={(activity) => setFormModal({ activity, mode: 'edit' })}
            onView={(activity) => setFormModal({ activity, mode: 'view' })}
            onFill={setFillTarget}
            onRequestDelete={setDeleteTarget}
            onCreateActivity={() => setFormModal({ activity: null, mode: 'create' })}
          />
        </TabsContent>
      </Tabs>

      <ActivityFormModal
        open={formModal !== null}
        onOpenChange={(open) => {
          if (!open) setFormModal(null)
        }}
        activity={formModal?.activity ?? null}
        mode={formModal?.mode ?? 'create'}
      />

      <ActivityFillModal
        open={fillTarget !== null}
        onOpenChange={(open) => {
          if (!open) setFillTarget(null)
        }}
        activity={fillTarget}
      />

      {deleteTarget ? (
        <ConfirmDeleteActivityDialog
          activity={deleteTarget}
          isPending={deleteActivity.isPending}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  )
}
