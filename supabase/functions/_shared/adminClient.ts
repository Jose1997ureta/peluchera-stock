import { createClient } from 'jsr:@supabase/supabase-js@2'

export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno de la función.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function findUserByEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  correo: string,
) {
  const normalizedEmail = correo.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const found = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail)
    if (found) return found

    if (data.users.length < perPage) return null
    page += 1
  }
}
