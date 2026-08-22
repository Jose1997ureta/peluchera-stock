import { corsHeaders } from '../_shared/cors.ts'
import { createAdminClient, findUserByEmail } from '../_shared/adminClient.ts'

const MIN_PASSWORD_LENGTH = 8

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { correo, password } = await req.json()

    if (typeof correo !== 'string' || !correo.trim()) {
      return new Response(JSON.stringify({ error: 'correo es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `password debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const adminClient = createAdminClient()
    const user = await findUserByEmail(adminClient, correo)

    if (!user) {
      return new Response(JSON.stringify({ error: 'No encontramos una cuenta con ese correo.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await adminClient.auth.admin.updateUserById(user.id, { password })
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('reset-password error', error)
    return new Response(JSON.stringify({ error: 'Ocurrió un error inesperado.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
