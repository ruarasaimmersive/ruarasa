import React, { useState, useEffect } from 'react'
import { initDB } from '../db'
import { GENERAL_SCRIPT_URL } from '../constants'

const Navigation = ({
  activePage,
}: {
  activePage: 'input' | 'history' | 'dashboard' | 'settings' | 'ticket'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [cashierName, setCashierName] = useState('-')
  const [scrolled, setScrolled] = useState(false)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    setCashierName(localStorage.getItem('cashier_name') || '-')

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ========== AUTO-SYNC LOGIC (Runs on all Kasir pages) ==========
  useEffect(() => {
    const AUTO_SYNC_INTERVAL = 10 * 60 * 1000 // 10 minutes

    const performAutoSync = async () => {
      // Check if online
      if (!navigator.onLine) {
        console.log('[AutoSync] Offline, skipping...')
        return
      }

      try {
        const db = await initDB()
        const allSales = await db.sales.find().exec()

        // Helper to check if date is today (Local Time)
        const isToday = (isoString: string) => {
          const date = new Date(isoString)
          const today = new Date()
          return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          )
        }

        const unsynced = allSales
          .map((d: any) => d.toJSON())
          .filter((s: any) => !s.is_synced) // Filter Unsynced (All Time)

        if (unsynced.length === 0) {
          console.log('[AutoSync] No unsynced data for today.')
          return
        }

        const generalData = unsynced

        const mapPayload = (items: any[]) => ({
          transactions: items
            .sort(
              (a: any, b: any) =>
                new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
            )
            .map((t: any) => {
              // Direct schema mapping
              const variant = t.variant || '-'
              const nameLower = t.nama_barang?.toLowerCase() || ''
              const isImmersive = nameLower.includes('immersive') || nameLower.includes('tiket')

              // Reported Price for Cashier
              let displayTotal = t.display_total ?? t.total_harga

              return {
                transaction_id: t.transaction_id,
                local_id: t.transaction_id, // Match GAS: local_id
                order_id: t.order_id,
                timestamp: t.tanggal,
                product: t.nama_barang, // Match GAS: product
                quantity: t.qty,
                total_price: Number(t.total_harga) || 0, // Real Price
                display_price: Number(displayTotal) || 0, // Secret/Reported Price
                variant: variant, // 'REGULER' | 'OUTING' | '-'
                payment: t.metode_pembayaran || 'CASH',
                cashier: t.kasir,
                customer: t.customer_name || '',
                no_telp: t.nomor_hp || '', // Match GAS: no_telp
                type: t.type || 'IN',
                notes: t.notes || '',
                deleted: t.is_deleted || false,
              }
            }),
        })

        // 1. Sync General Data
        if (generalData.length > 0) {
          console.log(
            `[AutoSync] Syncing ${generalData.length} items to GENERAL...`,
          )
          try {
            await fetch(GENERAL_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify(mapPayload(generalData)),
            })
            // Mark success locally
            const ids = generalData.map((s: any) => s.transaction_id)
            const docs = await db.sales
              .find({ selector: { transaction_id: { $in: ids } } })
              .exec()
            await Promise.all(
              docs.map((doc: any) => doc.patch({ is_synced: true })),
            )
          } catch (err) {
            console.error('[AutoSync] General Sync Failed', err)
          }
        }

        console.log('[AutoSync] Completed cycle.')
      } catch (e) {
        console.error('[AutoSync] Failed:', e)
      }
    }

    let isSyncingReq = false
    const tickInterval = setInterval(() => {
      const isPrintingMode = localStorage.getItem('is_printing_mode') === 'true'
      const isEnabled = localStorage.getItem('auto_sync_enabled') !== 'false' && !isPrintingMode
      if (!isEnabled) {
        localStorage.removeItem('next_sync_time')
        return
      }

      const intervalMin = parseInt(
        localStorage.getItem('auto_sync_interval') || '10',
        10,
      )
      const intervalMs = intervalMin * 60 * 1000

      let nextSyncStr = localStorage.getItem('next_sync_time')
      let nextSync = nextSyncStr ? parseInt(nextSyncStr, 10) : 0
      let now = Date.now()

      if (!nextSync || now >= nextSync) {
        if (isSyncingReq) return

        isSyncingReq = true
        // Set next sync time early so other tabs/renders see it too
        localStorage.setItem('next_sync_time', (now + intervalMs).toString())

        performAutoSync().finally(() => {
          isSyncingReq = false
        })
      }
    }, 1000)

    return () => {
      clearInterval(tickInterval)
    }
  }, [])
  // ================================================================

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    localStorage.removeItem('cashier_name')
    // Hapus HttpOnly cookie via API endpoint
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login-cashier'
  }

  const navItemClass = (page: string) =>
    `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative group cursor-pointer ${
      activePage === page
        ? 'text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100 dark:bg-emerald-900/40 shadow-emerald-500/20 shadow-lg scale-105'
        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`

  return (
    <>
      {/* Top Bar for Desktop */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-5'}`}
      >
        <div className='flex justify-between items-center mx-auto px-6 max-w-5xl'>
          <a href='/cashier' className='flex items-center gap-3'>
            <div className='flex justify-center items-center bg-emerald-600 shadow-emerald-500/20 shadow-lg rounded-xl w-10 h-10 font-bold text-white text-xl'>
              R
            </div>
            <div>
              <h1 className='font-bold text-zinc-900 dark:text-white text-xl leading-none tracking-tight'>
                Kasir Rua Rasa
              </h1>
            </div>
          </a>

          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center gap-2 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full'>
              <span className='font-bold text-zinc-500 text-xs'>KASIR</span>
              <span className='font-bold text-zinc-900 dark:text-zinc-100 text-sm capitalize'>
                {cashierName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className='flex justify-center items-center bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 rounded-full w-10 h-10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer'
              title='Logout'
            >
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                <polyline points='16 17 21 12 16 7' />
                <line x1='21' y1='12' x2='9' y2='12' />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Dock for Mobile Navigation */}
      <nav className='bottom-0 md:bottom-6 left-0 md:left-1/2 z-50 fixed flex justify-around md:justify-center items-center gap-0 md:gap-1 bg-white/90 md:bg-transparent md:dark:bg-transparent dark:bg-zinc-900/95 md:shadow-2xl md:dark:shadow-black/60 md:shadow-zinc-900/20 md:backdrop-blur-xl md:px-2 py-3 md:py-2 md:border border-zinc-200 md:border-white/40 md:dark:border-zinc-700 dark:border-zinc-800 border-t md:border-t-0 md:rounded-4xl w-full md:w-auto md:-translate-x-1/2 md:glass'>
        <a href='/cashier' className={navItemClass('input')}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='16' />
            <line x1='8' y1='12' x2='16' y2='12' />
          </svg>
        </a>
        <a href='/cashier/ticket' className={navItemClass('ticket')}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' />
            <path d='M9 9h.01' />
            <path d='M15 9h.01' />
            <path d='M9 15h.01' />
            <path d='M15 15h.01' />
          </svg>
        </a>
        <a href='/cashier/history' className={navItemClass('history')}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 20v-6M6 20V10M18 20V4' />
          </svg>
        </a>
        <a href='/cashier/dashboard' className={navItemClass('dashboard')}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='3' width='7' height='7' />
            <rect x='14' y='3' width='7' height='7' />
            <rect x='14' y='14' width='7' height='7' />
            <rect x='3' y='14' width='7' height='7' />
          </svg>
        </a>
        <a href='/cashier/settings' className={navItemClass('settings')}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' />
            <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H15.4a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z' />
          </svg>
        </a>
      </nav>

      {/* Spacer for fixed header */}
      <div className='h-24'></div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in'
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-3xl w-full max-w-sm text-center animate-in zoom-in-95'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-center items-center bg-red-100 dark:bg-red-900/40 mx-auto mb-4 rounded-full w-16 h-16 text-red-600 dark:text-red-400 text-3xl'>
              ⚠️
            </div>
            <h2 className='mb-2 font-bold text-zinc-900 dark:text-white text-xl'>
              Konfirmasi Logout
            </h2>
            <p className='mb-6 text-zinc-500 text-sm'>
              Apakah anda yakin ingin keluar dari sesi kasir{' '}
              <span className='font-bold text-zinc-900 dark:text-white'>
                {cashierName}
              </span>
              ?
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className='flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer'
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className='flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 py-3 rounded-xl font-bold text-white transition-colors cursor-pointer'
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation
