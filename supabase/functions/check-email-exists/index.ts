import { corsHeaders } from '../_shared/cors.ts'
import { createAdminClient, findUserByEmail } from '../_shared/adminClient.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { correo } = await req.json()

    if (typeof correo !== 'string' || !correo.trim()) {
      return new Response(JSON.stringify({ error: 'correo es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createAdminClient()
    const user = await findUserByEmail(adminClient, correo)

    return new Response(JSON.stringify({ exists: user !== null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('check-email-exists error', error)
    return new Response(JSON.stringify({ error: 'Ocurrió un error inesperado.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
