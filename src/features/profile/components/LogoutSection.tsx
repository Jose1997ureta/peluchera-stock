import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog'
import { useAuth } from '@/shared/context/AuthContext'

export function LogoutSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleConfirm() {
    await logout()
    setConfirmOpen(false)
    navigate('/login')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cerrar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Vas a cerrar la sesión en este dispositivo. Vas a necesitar volver a iniciar sesión para
          acceder de nuevo.
        </p>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Cerrar sesión
        </Button>
      </CardContent>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cerrar sesión"
        description="¿Seguro que querés cerrar la sesión de este dispositivo?"
        confirmLabel="Cerrar sesión"
        isDestructive
        isPending={false}
        onConfirm={handleConfirm}
      />
    </Card>
  )
}
