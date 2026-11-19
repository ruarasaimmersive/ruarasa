import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(({ request, cookies, redirect }, next) => {
  const url = new URL(request.url)

  // Proteksi semua halaman di bawah /cashier/* (tapi bukan /login-cashier)
  const isCashierRoute = url.pathname.startsWith('/cashier/') || url.pathname === '/cashier'
  
  if (isCashierRoute) {
    const isAuthenticated = cookies.get('cashier_auth')?.value === '1'

    if (!isAuthenticated) {
      // Redirect ke halaman login kasir jika belum login
      return redirect('/login-cashier', 302)
    }
  }

  return next()
})
