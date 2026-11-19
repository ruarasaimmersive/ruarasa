import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  const isAuthenticated = cookies.get('cashier_auth')?.value === '1'
  return new Response(JSON.stringify({ authenticated: isAuthenticated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
