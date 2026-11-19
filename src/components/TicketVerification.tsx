import React, { useState, useEffect } from 'react'
import {
  getOnlineBookings,
  getBookingsByStatus,
  updateBookingStatus,
  type OnlineBooking,
  supabase,
} from '../lib/supabase'
import { initDB, addSale, getSalesCollection } from '../db'
import { sendWhatsAppNotification } from '../lib/whatsapp'
import { GENERAL_SCRIPT_URL } from '../constants'
import { PrintReceipt } from './PrintReceipt'

const TicketVerification = () => {
  const [bookings, setBookings] = useState<OnlineBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [cashierName, setCashierName] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [printSale, setPrintSale] = useState<any[] | null>(null)

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  // Confirmation Modal (for Bayar)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    isPayment: boolean
    onConfirm: (value?: string) => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    isPayment: false,
    onConfirm: () => {},
  })

  useEffect(() => {
    const name = localStorage.getItem('cashier_name') || 'Admin'
    setCashierName(name)
    fetchBookings()

    const channel = supabase
      .channel('ticket-verification')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_bookings' }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const fetchBookings = async () => {
    try {
      const data = await getOnlineBookings()
      setBookings(data || [])
    } catch {
      showToast('Gagal mengambil data booking', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
  }

  const normalizeTimestamp = (ts: string | undefined) =>
    ts ? new Date(ts).toISOString() : new Date().toISOString()

  // ─────────────────────────────────────────
  // Import SELESAI/TERVERIFIKASI ke RxDB
  // ─────────────────────────────────────────
  const handleImportVerified = async () => {
    setImporting(true)
    try {
      const verified = await getBookingsByStatus('TERVERIFIKASI')
      const completed = await getBookingsByStatus('SELESAI')
      const all = [...(verified || []), ...(completed || [])]

      if (all.length === 0) { showToast('Tidak ada data untuk diimport', 'error'); return }

      const salesCollection = await getSalesCollection()
      const existing = await salesCollection.find().exec()
      const existingIds = new Set<number>(existing.map((s: any) => s.booking_id).filter(Boolean))
      const toImport = all.filter((b) => b.id && !existingIds.has(b.id))

      if (toImport.length === 0) { showToast('Semua data sudah ada di History ✓', 'success'); return }

      for (const booking of toImport) {
        await addSale({
          tanggal: normalizeTimestamp(booking.created_at),
          nama_barang: booking.product_name,
          qty: booking.qty,
          harga_satuan: booking.unit_price,
          total_harga: booking.total_price,
          metode_pembayaran: 'Website',
          nomor_hp: booking.phone,
          customer_name: booking.customer_name,
          kasir: cashierName,
          is_synced: false,
          source: 'UMUM',
          type: 'IN',
          booking_id: booking.id,
        })
      }
      showToast(`Berhasil import ${toImport.length} data! ✅`, 'success')
    } catch {
      showToast('Gagal import data ❌', 'error')
    } finally {
      setImporting(false)
    }
  }

  // Helper to handle print execution safely
  const handlePrintReceipt = async (saleItem: any) => {
    setPrintSale([saleItem])
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    if (isMobile) {
      window.print()
      // Keep DOM mounted for 15 seconds on mobile to allow the spooler to capture it
      setTimeout(() => {
        setPrintSale(null)
      }, 15000)
    } else {
      let finalized = false
      const cleanup = () => {
        if (!finalized) {
          finalized = true
          setPrintSale(null)
          window.removeEventListener('afterprint', cleanup)
        }
      }
      window.addEventListener('afterprint', cleanup)
      window.print()
      setTimeout(cleanup, 3000)
    }
  }

  // Helper to save sale locally and trigger immediate auto sync to Google Sheets
  const saveAndSyncSale = async (saleData: any) => {
    let doc: any = null
    let saleJson: any = null

    try {
      // 1. Save to local RxDB
      doc = await addSale(saleData)
      saleJson = doc.toJSON()

      // Calculate daily sequence by loading all sales and filtering in JS to avoid RxDB Dexie schema index errors
      const db = await initDB()
      const allSalesDocs = await db.sales.find().exec()
      const allSales = allSalesDocs.map((s: any) => s.toJSON())
      const datePrefix = saleJson.tanggal.substring(0, 10)
      const sameDaySales = allSales
        .filter((s: any) => s.type === 'IN' && s.tanggal.startsWith(datePrefix))
        .sort((a: any, b: any) => a.order_id - b.order_id)
      
      const idx = sameDaySales.findIndex((s: any) => s.transaction_id === saleJson.transaction_id)
      saleJson.daily_sequence = idx !== -1 ? idx + 1 : 1
    } catch (err) {
      console.error('[saveAndSyncSale] Error saving sale locally:', err)
      return null
    }

    // 2. Sync to Google Sheets (isolated from printing flow so network failure doesn't block receipt printing)
    try {
      const payload = {
        transactions: [{
          transaction_id: saleJson.transaction_id,
          local_id: saleJson.transaction_id,
          order_id: saleJson.order_id,
          timestamp: saleJson.tanggal,
          product: saleJson.nama_barang,
          quantity: saleJson.qty,
          total_price: Number(saleJson.total_harga) || 0,
          display_price: Number(saleJson.display_total ?? saleJson.total_harga) || 0,
          variant: saleJson.variant || '-',
          payment: saleJson.metode_pembayaran || 'CASH',
          cashier: saleJson.kasir,
          customer: saleJson.customer_name || '',
          no_telp: saleJson.nomor_hp || '',
          is_dp: false,
          dp_amount: 0,
          type: 'IN',
          notes: saleJson.notes || '',
          deleted: false,
        }]
      }

      await fetch(GENERAL_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      })

      // 3. Mark as synced in local RxDB on success
      await doc.patch({ is_synced: true })
      saleJson.is_synced = true
      console.log('[saveAndSyncSale] Sale synced to server successfully:', saleJson.transaction_id)
    } catch (err) {
      console.error('[saveAndSyncSale] Error syncing sale to Google Sheets (will retry later):', err)
      // We do not return null here, so the printable receipt (saleJson) is still returned to the UI.
    }

    return saleJson
  }

  // ─────────────────────────────────────────
  // Bayar Onsite (BOOKING → SELESAI)
  // ─────────────────────────────────────────
  const handlePayment = (booking: OnlineBooking) => {
    if (!booking.id) return
    setConfirmConfig({
      isOpen: true,
      title: 'Terima Pembayaran',
      message: `Pilih metode pembayaran untuk ${booking.customer_name} (Rp ${booking.total_price.toLocaleString('id-ID')}):`,
      isPayment: true,
      onConfirm: async (method) => {
        const paymentMethod = method || 'CASH'
        setProcessingId(booking.id || null)
        setConfirmConfig((p) => ({ ...p, isOpen: false }))
        try {
          await updateBookingStatus(booking.id!, 'SELESAI', {
            verified_by: cashierName,
            completed_at: new Date().toISOString(),
          } as any)

          const saleJson = await saveAndSyncSale({
            tanggal: new Date().toISOString(),
            nama_barang: booking.product_name,
            qty: booking.qty,
            harga_satuan: booking.unit_price,
            total_harga: booking.total_price,
            metode_pembayaran: paymentMethod,
            nomor_hp: booking.phone,
            customer_name: booking.customer_name,
            kasir: cashierName,
            is_synced: false,
            source: 'UMUM',
            type: 'IN',
            booking_id: booking.id,
            variant: booking.product_name.toLowerCase().includes('outing') || booking.product_name.toLowerCase().includes('paket')
              ? 'OUTING'
              : booking.product_name.toLowerCase().includes('pelajar')
              ? 'PELAJAR'
              : 'REGULER',
          })

          await sendWhatsAppNotification({
            type: 'COMPLETED',
            customer: { name: booking.customer_name, phone: booking.phone },
            booking: {
              id: booking.id!,
              items: [{ product: booking.product_name, qty: booking.qty, price: booking.unit_price }],
              total: booking.total_price,
              date: new Date().toISOString(),
              payment_method: paymentMethod,
            },
          })
          showToast(`Pembayaran ${paymentMethod} berhasil & disinkronkan! 💰`, 'success')
          fetchBookings()

          if (saleJson) {
            setTimeout(() => {
              const confirmPrint = window.confirm('Apakah Anda ingin mencetak struk untuk customer ini?')
              if (confirmPrint) {
                handlePrintReceipt(saleJson)
              }
            }, 300)
          }
        } catch {
          showToast('Gagal memproses pembayaran ❌', 'error')
        } finally {
          setProcessingId(null)
        }
      },
    })
  }

  // ─────────────────────────────────────────
  // Hadir (TERVERIFIKASI → SELESAI)
  // ─────────────────────────────────────────
  const handleHadir = async (booking: OnlineBooking) => {
    if (!booking.id) return
    setProcessingId(booking.id)
    try {
      // 1. Update status to SELESAI in Supabase
      await updateBookingStatus(booking.id, 'SELESAI', {
        verified_by: cashierName,
        completed_at: new Date().toISOString(),
      } as any)

      // 2. Insert into local RxDB and auto sync to Google Sheet
      const saleJson = await saveAndSyncSale({
        tanggal: new Date().toISOString(),
        nama_barang: booking.product_name,
        qty: booking.qty,
        harga_satuan: booking.unit_price,
        total_harga: booking.total_price,
        metode_pembayaran: 'Website',
        nomor_hp: booking.phone,
        customer_name: booking.customer_name,
        kasir: cashierName,
        is_synced: false,
        source: 'UMUM',
        type: 'IN',
        booking_id: booking.id,
        variant: booking.product_name.toLowerCase().includes('outing') || booking.product_name.toLowerCase().includes('paket')
          ? 'OUTING'
          : booking.product_name.toLowerCase().includes('pelajar')
          ? 'PELAJAR'
          : 'REGULER',
      })

      showToast('Customer hadir! Status diperbarui & disinkronkan. ✅', 'success')
      fetchBookings()

      if (saleJson) {
        setTimeout(() => {
          const confirmPrint = window.confirm('Apakah Anda ingin mencetak struk untuk customer ini?')
          if (confirmPrint) {
            handlePrintReceipt(saleJson)
          }
        }, 300)
      }
    } catch (err) {
      console.error(err)
      showToast('Gagal memperbarui status ❌', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // ─────────────────────────────────────────
  // Status Badge
  // ─────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      MENUNGGU_VERIFIKASI: 'bg-amber-100 border-amber-200 text-amber-700',
      BOOKING: 'bg-sky-100 border-sky-200 text-sky-700',
      TERVERIFIKASI: 'bg-emerald-100 border-emerald-200 text-emerald-700',
      SELESAI: 'bg-blue-100 border-blue-200 text-blue-700',
      DIBATALKAN: 'bg-red-100 border-red-200 text-red-500',
    }
    const label: Record<string, string> = {
      MENUNGGU_VERIFIKASI: 'Menunggu Bayar',
      BOOKING: 'Bayar di Kasir',
      TERVERIFIKASI: 'Terbayar (QRIS)',
      SELESAI: 'Selesai',
      DIBATALKAN: 'Dibatalkan',
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md font-bold text-[10px] uppercase tracking-wide ${map[status] || 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
        {status === 'MENUNGGU_VERIFIKASI' || status === 'TERVERIFIKASI' ? (
          <span className='relative flex w-2 h-2'>
            <span className={`inline-flex absolute rounded-full w-full h-full animate-ping opacity-75 ${status === 'MENUNGGU_VERIFIKASI' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className={`inline-flex relative rounded-full w-2 h-2 ${status === 'MENUNGGU_VERIFIKASI' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
        ) : null}
        {label[status] || status}
      </span>
    )
  }

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase()
    if (q.startsWith('#')) return String(b.id).includes(q.substring(1))
    return (
      b.customer_name.toLowerCase().includes(q) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      String(b.id).includes(q)
    )
  })

  return (
    <div className='bg-zinc-50 dark:bg-zinc-950 md:px-4 md:py-10 pb-32 min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200'>
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      {/* Payment Modal */}
      {confirmConfig.isOpen && (
        <div className='z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in' onClick={() => setConfirmConfig((p) => ({ ...p, isOpen: false }))}>
          <div className='bg-zinc-900 shadow-2xl p-6 border border-zinc-700 rounded-3xl w-full max-w-sm text-center animate-in zoom-in-95' onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-center items-center bg-emerald-900/40 mx-auto mb-4 rounded-full w-16 h-16 text-3xl'>💰</div>
            <h2 className='mb-2 font-bold text-white text-xl'>{confirmConfig.title}</h2>
            <p className='mb-6 font-medium text-zinc-400 text-sm'>{confirmConfig.message}</p>
            <div className='flex gap-3'>
              <button type='button' onClick={() => setConfirmConfig((p) => ({ ...p, isOpen: false }))} className='flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer'>
                Batal
              </button>
              <button type='button' onClick={() => confirmConfig.onConfirm('CASH')} className='flex-1 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 py-3 rounded-xl font-bold text-white transition-colors cursor-pointer'>
                💵 Cash
              </button>
              <button type='button' onClick={() => confirmConfig.onConfirm('QRIS')} className='flex-1 bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-900/20 py-3 rounded-xl font-bold text-white transition-colors cursor-pointer'>
                💳 QRIS
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='mx-auto md:p-8 w-full max-w-7xl'>
        {/* Header */}
        <div className='mb-8 p-4 md:p-0 text-center'>
          <h1 className='font-black text-zinc-900 dark:text-white text-3xl md:text-4xl tracking-tight'>Tiket Online</h1>
          <p className='mt-2 font-medium text-zinc-400'>Daftar semua transaksi tiket online</p>
        </div>

        {/* Search + Import */}
        <div className='mb-6 px-4 md:px-0'>
          <div className='flex gap-3'>
            <div className='relative flex-1'>
              <div className='left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none'>
                <span className='text-zinc-500'>🔍</span>
              </div>
              <input
                type='text'
                className='block bg-white dark:bg-zinc-900 shadow-sm py-3 pr-3 pl-10 border border-zinc-200 focus:border-emerald-500 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full text-zinc-900 dark:text-zinc-100 sm:text-sm placeholder-zinc-500 transition-all'
                placeholder='Cari Nama, No. HP, atau ID (#123)...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type='button'
              onClick={handleImportVerified}
              disabled={importing}
              className='flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 shadow-amber-500/20 shadow-lg px-4 py-3 rounded-xl font-bold text-white text-sm transition-colors cursor-pointer disabled:cursor-not-allowed'
              title='Import data ke History'
            >
              {importing ? (
                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : <span>📥</span>}
              <span className='hidden md:inline'>{importing ? 'Importing...' : 'Import Data Lama'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='bg-transparent p-0 md:p-1 md:rounded-4xl min-h-[50vh] overflow-hidden md:glass-card'>
          {loading ? (
            <div className='flex flex-col justify-center items-center py-20 min-h-[50vh] text-zinc-400'>
              <svg className='mb-4 w-12 h-12 text-emerald-500 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
              <p className='font-medium text-lg animate-pulse'>Memuat data tiket...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className='flex flex-col justify-center items-center opacity-50 py-20 min-h-[50vh]'>
              <div className='mb-4 text-4xl animate-bounce'>💤</div>
              <p className='font-bold text-zinc-500'>Belum ada transaksi</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='border-zinc-100 dark:border-zinc-800 border-b font-bold text-zinc-400 text-xs uppercase'>
                  <tr>
                    <th className='px-4 py-4 text-center tracking-wider'>ID</th>
                    <th className='px-4 py-4 tracking-wider'>Customer</th>
                    <th className='px-4 py-4 text-center tracking-wider'>Status</th>
                    <th className='px-4 py-4 tracking-wider'>Tiket</th>
                    <th className='px-4 py-4 text-right tracking-wider'>Total</th>
                    <th className='px-4 py-4 text-right tracking-wider'>Aksi</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-zinc-50 dark:divide-zinc-800/50'>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className='group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-zinc-50 dark:border-zinc-800/50 border-b transition-all'>
                      {/* ID */}
                      <td className='px-4 py-4 w-16 text-center'>
                        <span className='inline-block bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg font-mono font-bold text-zinc-600 dark:text-zinc-400 text-xs'>
                          #{booking.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex justify-center items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl w-10 min-w-10 h-10 text-blue-500 text-xl'>👤</div>
                          <div>
                            <div className='font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap'>{booking.customer_name}</div>
                            <div className='flex flex-col mt-0.5 text-zinc-400 text-xs'>
                              <span className='flex items-center gap-1'>📱 {booking.phone}</span>
                              <span className='mt-0.5'>
                                {new Date(booking.created_at || '').toLocaleString('id-ID', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className='px-4 py-4 text-center'>{statusBadge(booking.status)}</td>

                      {/* Tiket */}
                      <td className='px-4 py-4'>
                        <div className='font-medium text-zinc-700 dark:text-zinc-300'>{booking.product_name}</div>
                        <div className='text-zinc-400 text-xs'>Qty: {booking.qty}</div>
                      </td>

                      {/* Total */}
                      <td className='px-4 py-4 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-right'>
                        Rp {booking.total_price.toLocaleString('id-ID')}
                      </td>

                      {/* Aksi */}
                      <td className='px-4 py-4 text-right'>
                        {booking.status === 'BOOKING' && (
                          <button
                            type='button'
                            onClick={() => handlePayment(booking)}
                            disabled={!!processingId}
                            className='bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1.5 border border-emerald-200 hover:border-emerald-400 dark:border-emerald-800 rounded-lg font-bold text-emerald-600 dark:text-emerald-400 text-xs transition-colors disabled:opacity-50 cursor-pointer'
                          >
                            💰 Bayar
                          </button>
                        )}
                        {booking.status === 'TERVERIFIKASI' && (
                          <button
                            type='button'
                            onClick={() => handleHadir(booking)}
                            disabled={!!processingId}
                            className='bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 border border-blue-200 hover:border-blue-400 dark:border-blue-800 rounded-lg font-bold text-blue-600 dark:text-blue-400 text-xs transition-colors disabled:opacity-50 cursor-pointer'
                          >
                            🎟️ Hadir
                          </button>
                        )}
                        {booking.status === 'SELESAI' && (
                          <span className='text-zinc-300 dark:text-zinc-600 text-xs'>✓ Selesai</span>
                        )}
                        {booking.status === 'DIBATALKAN' && (
                          <span className='text-red-400 text-xs italic'>Dibatalkan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hidden print container for thermal receipt printer */}
      {printSale && (
        <PrintReceipt sales={printSale} />
      )}
    </div>
  )
}

export default TicketVerification
