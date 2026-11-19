import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return new Response(JSON.stringify({ error: 'Name and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Ambil password aman dari .env yang tertutup di backend
    const correctPassword = import.meta.env.CASHIER_PASSWORD || process.env.CASHIER_PASSWORD || 'rua123'

    if (password !== correctPassword) {
      return new Response(JSON.stringify({ error: 'Password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Jika benar: set HttpOnly cookie agar middleware bisa memverifikasi di server
    return new Response(JSON.stringify({ success: true, name }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `cashier_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
