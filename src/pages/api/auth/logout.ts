import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Hapus cookie dengan menyetel Max-Age=0
      'Set-Cookie': `cashier_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  })
}
