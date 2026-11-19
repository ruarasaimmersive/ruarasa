import React, { useState, useEffect } from 'react'
import { ALLOWED_CASHIERS } from '../constants'

const Login = () => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [toastState, setToastState] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({
    show: false,
    message: '',
    type: 'success',
  })

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastState.show) {
      const timer = setTimeout(() => {
        setToastState((prev) => ({ ...prev, show: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastState.show])

  useEffect(() => {
    // Bersihkan localStorage lama agar tidak loop dengan sistem cookie baru
    // Verifikasi sesi via server (cookie HttpOnly tidak bisa dibaca dari JS)
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          window.location.href = '/cashier'
        } else {
          // Hapus sisa data localStorage lama agar tidak menyebabkan loop
          localStorage.removeItem('cashier_name')
        }
      })
      .catch(() => localStorage.removeItem('cashier_name'))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim()

    if (!cleanName) {
      setToastState({
        show: true,
        message: 'Silakan masukkan nama kasir',
        type: 'error',
      })
      return
    }

    const lowerName = cleanName.toLowerCase()
    const isAllowed = ALLOWED_CASHIERS.includes(lowerName)

    if (!isAllowed) {
      setToastState({
        show: true,
        message: 'Nama kasir tidak terdaftar!',
        type: 'error',
      })
      return
    }

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: cleanName, password })
      })

      const data = await resp.json()

      if (!resp.ok) {
        setToastState({
          show: true,
          message: data.error || 'Password salah!',
          type: 'error',
        })
        return
      }

      // Berlaku jika login sukses lewat backend API
      const finalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      localStorage.setItem('cashier_name', finalName)
      window.location.href = '/cashier'

    } catch (err) {
      setToastState({
        show: true,
        message: 'Gagal terhubung ke server',
        type: 'error',
      })
    }
  }

  return (
    <div className='flex justify-center items-center bg-zinc-950 p-4 min-h-screen pattern-cultural'>
      {/* Toast Notification */}
      {toastState.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 ${
            toastState.type === 'error'
              ? 'bg-rose-500 text-white'
              : 'bg-emerald-500 text-white'
          }`}
        >
          <span>{toastState.type === 'error' ? '⚠️' : '✅'}</span>
          {toastState.message}
        </div>
      )}

      <div className='shadow-2xl p-10 border-white/40 rounded-[2.5rem] w-full max-w-sm text-center animate-in duration-500 glass-card zoom-in-95'>
        <div className='flex justify-center items-center bg-emerald-600 shadow-emerald-500/30 shadow-lg mx-auto mb-8 rounded-3xl w-24 h-24 text-5xl rotate-3 hover:rotate-6 transition-transform'>
          👤
        </div>

        <h1 className='mb-2 font-extrabold text-zinc-900 dark:text-white text-3xl tracking-tight'>
          Login Kasir
        </h1>
        <p className='mb-8 font-medium text-zinc-500'>
          Masukan nama untuk akses sistem
        </p>

        <form onSubmit={handleLogin} className='space-y-6'>
          <div className='group relative'>
            <div className='left-0 absolute inset-y-0 flex items-center pl-5 pointer-events-none'>
              <span className='opacity-50 group-hover:opacity-100 text-2xl transition-opacity'>
                🏷️
              </span>
            </div>
            <input
              id='username'
              name='username'
              type='text'
              autoComplete='username'
              placeholder='Ketik Nama Kasir...'
              className='bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 shadow-inner py-6 pr-6 pl-14 border-2 border-zinc-200 hover:border-emerald-400 focus:border-emerald-500 dark:border-zinc-700 rounded-2xl outline-none hover:ring-4 hover:ring-emerald-100 focus:ring-4 focus:ring-emerald-200 dark:hover:ring-emerald-900/30 dark:focus:ring-emerald-900/50 w-full font-bold placeholder:text-zinc-400 text-xl transition-all'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className='group relative'>
            <div className='left-0 absolute inset-y-0 flex items-center pl-5 pointer-events-none'>
              <span className='opacity-50 group-hover:opacity-100 text-2xl transition-opacity'>
                🔒
              </span>
            </div>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              placeholder='Password Kasir...'
              className='bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 shadow-inner py-6 pr-6 pl-14 border-2 border-zinc-200 hover:border-emerald-400 focus:border-emerald-500 dark:border-zinc-700 rounded-2xl outline-none hover:ring-4 hover:ring-emerald-100 focus:ring-4 focus:ring-emerald-200 dark:hover:ring-emerald-900/30 dark:focus:ring-emerald-900/50 w-full font-bold placeholder:text-zinc-400 text-xl transition-all'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type='submit'
            className='bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 shadow-xl hover:shadow-2xl py-6 rounded-2xl hover:ring-4 hover:ring-zinc-300 dark:hover:ring-zinc-700 ring-offset-2 w-full font-black text-white dark:text-zinc-900 text-xl tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer'
          >
            MASUK SISTEM
          </button>
        </form>

        <div className='mt-8 font-bold text-zinc-300 text-xs uppercase tracking-widest'>
          RuaRasa System
        </div>
      </div>
    </div>
  )
}

export default Login
