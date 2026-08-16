import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { compressImage } from '@/shared/utils/image'

const AVATARS_BUCKET = 'avatars'
const AVATAR_MAX_DIMENSION = 512

export interface AuthUser {
  id: string
  nombre: string
  apellido: string
  correo: string
  telefono: string
  fechaNacimiento: string
  avatarUrl?: string
}

export interface ProfileUpdateInput {
  nombre: string
  apellido: string
  telefono: string
  fechaNacimiento: string
}

export interface RegisterInput {
  nombre: string
  apellido: string
  correo: string
  password: string
  telefono: string
  fechaNacimiento: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (correo: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (input: RegisterInput) => Promise<boolean>
  updateProfile: (input: ProfileUpdateInput) => Promise<void>
  updateAvatar: (file: File) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getAvatarPath(avatarUrl: string): string | null {
  const marker = `/${AVATARS_BUCKET}/`
  const index = avatarUrl.indexOf(marker)
  if (index === -1) return null
  return avatarUrl.slice(index + marker.length)
}

async function removeAvatarImage(avatarUrl: string): Promise<void> {
  const path = getAvatarPath(avatarUrl)
  if (!path) return

  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path])
  if (error) console.error('Failed to remove avatar image from storage', error)
}

async function fetchAuthUser(supabaseUser: User): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single()

  if (error) throw error

  return {
    id: supabaseUser.id,
    nombre: data.nombre,
    apellido: data.apellido,
    correo: supabaseUser.email ?? '',
    telefono: data.telefono ?? '',
    fechaNacimiento: data.fecha_nacimiento ?? '',
    avatarUrl: data.avatar_url ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function hydrateFromSession(session: Session | null) {
      if (!session) {
        if (active) setUser(null)
        return
      }
      const authUser = await fetchAuthUser(session.user)
      if (active) setUser(authUser)
    }

    supabase.auth.getSession().then(({ data }) => {
      hydrateFromSession(data.session).finally(() => {
        if (active) setIsLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromSession(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function login(correo: string, password: string): Promise<boolean> {
    // Sesión real de Supabase Auth. onAuthStateChange (arriba) se encarga de
    // hidratar `user` apenas el login resuelve, no hace falta hacerlo acá.
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
    return !error
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  async function register(input: RegisterInput): Promise<boolean> {
    // El perfil (profiles) se crea solo, vía trigger on_auth_user_created,
    // a partir de este mismo metadata (ver supabase/migrations).
    const { data, error } = await supabase.auth.signUp({
      email: input.correo,
      password: input.password,
      options: {
        data: {
          nombre: input.nombre,
          apellido: input.apellido,
          telefono: input.telefono,
          fecha_nacimiento: input.fechaNacimiento,
        },
      },
    })

    if (error) return false
    return data.user !== null
  }

  async function updateProfile(input: ProfileUpdateInput): Promise<void> {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        nombre: input.nombre,
        apellido: input.apellido,
        telefono: input.telefono,
        fecha_nacimiento: input.fechaNacimiento,
      })
      .eq('id', user.id)

    if (error) throw error

    setUser({ ...user, ...input })
  }

  async function updateAvatar(file: File): Promise<void> {
    if (!user) return

    const previousAvatarUrl = user.avatarUrl

    const compressed = await compressImage(file, { maxDimension: AVATAR_MAX_DIMENSION })
    const path = `${user.id}/${crypto.randomUUID()}.webp`

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, compressed)
    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id)

    if (error) throw error

    setUser({ ...user, avatarUrl: publicUrlData.publicUrl })

    if (previousAvatarUrl && previousAvatarUrl !== publicUrlData.publicUrl) {
      await removeAvatarImage(previousAvatarUrl)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
