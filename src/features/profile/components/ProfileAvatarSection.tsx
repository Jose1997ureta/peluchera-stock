import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useAuth } from '@/shared/context/AuthContext'
import { toast } from '@/shared/lib/toast'
import {
  AVATAR_IMAGE_ACCEPTED_TYPES,
  AVATAR_IMAGE_MAX_SIZE_BYTES,
} from '../schemas/profile.schema'

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

export function ProfileAvatarSection() {
  const { user, updateAvatar } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!user) return null

  async function handleFileSelect(file: File | undefined) {
    if (!file) return

    if (!AVATAR_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato no soportado. Usá JPG, PNG o WEBP.')
      return
    }
    if (file.size > AVATAR_IMAGE_MAX_SIZE_BYTES) {
      toast.error('La imagen supera el tamaño máximo de 1 MB.')
      return
    }

    setIsSaving(true)
    try {
      await updateAvatar(file)
      toast.success('Foto de perfil actualizada.')
    } catch {
      toast.error('No se pudo actualizar la foto de perfil. Intentá de nuevo.')
    } finally {
      setIsSaving(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => inputRef.current?.click()}
            aria-label="Cambiar foto de perfil"
            className="group relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              getInitials(user.nombre, user.apellido)
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-background/70 group-hover:flex">
              <Camera aria-hidden="true" className="size-5 text-foreground" />
            </span>
          </button>

          <div>
            <p className="text-sm font-medium text-foreground">
              {user.nombre} {user.apellido}
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 1 MB</p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_IMAGE_ACCEPTED_TYPES.join(',')}
          onChange={(event) => handleFileSelect(event.target.files?.[0])}
          className="sr-only"
        />
      </CardContent>
    </Card>
  )
}
