import { supabase } from '@/shared/lib/supabase'

export async function checkEmailExists(correo: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ exists: boolean }>(
    'check-email-exists',
    { body: { correo } },
  )
  if (error) throw error
  return data?.exists ?? false
}

export async function resetPassword(correo: string, password: string): Promise<void> {
  const { error } = await supabase.functions.invoke('reset-password', {
    body: { correo, password },
  })
  if (error) throw error
}
