import { useState } from 'react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { generateWAMessage } from '../utils/whatsappFormatter'
import { NetOmzetCard } from './dashboard/NetOmzetCard'
import { StatsGrid } from './dashboard/StatsGrid'
import { ExpenseBreakdown } from './dashboard/ExpenseBreakdown'

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback ke execCommand di bawah
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch {
    return false
  }
}

const Dashboard = () => {
  const stats = useDashboardStats()
  const [isWAModalOpen, setIsWAModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const CONTACTS = [
    { name: 'Zakki', phone: '628175752620' },
    { name: 'Nida', phone: '6281933006737' },
    { name: 'Lobby', phone: '6287835297789' },
  ]

  const buildReportMessage = () =>
    generateWAMessage({
      cashBreakdown: stats.cashBreakdown,
      qrisBreakdown: stats.qrisBreakdown,
      websiteBreakdown: stats.websiteBreakdown,
      dashboardDocs: stats.dashboardDocs,
      cashTotal: stats.cashTotal,
      qrisTotal: stats.qrisTotal,
      generalExpense: stats.generalExpense,
    })

  const handleCopyOnly = async () => {
    const message = buildReportMessage()
    const ok = await copyTextToClipboard(message)
    if (ok) {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsWAModalOpen(false)
      }, 1200)
    } else {
      alert('Gagal menyalin teks ke clipboard.')
    }
  }

  const handleOpenWhatsApp = (contact: (typeof CONTACTS)[0]) => {
    const message = buildReportMessage()
    const encodedText = encodeURIComponent(message)
    const waUrl = `https://wa.me/${contact.phone}?text=${encodedText}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    setIsWAModalOpen(false)
  }

  return (
    <div className='slide-in-from-bottom-4 space-y-6 mx-auto px-4 md:px-0 max-w-4xl animate-in duration-500 fade-in'>
      <div className='flex justify-between items-end mb-8'>
        <div className='md:text-left text-center'>
          <h1 className='font-extrabold text-zinc-900 dark:text-white text-3xl tracking-tight'>
            Dashboard
          </h1>
          <p className='text-zinc-500'>Ringkasan performa hari ini</p>
        </div>
        <button
          onClick={() => {
            setCopied(false)
            setIsWAModalOpen(true)
          }}
          className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg px-5 py-2.5 rounded-xl font-bold text-white text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer'
        >
          <svg
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
          >
            <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
          </svg>
          <span>Kirim / Copy WA</span>
        </button>
      </div>

      <div className='gap-4 grid grid-cols-2 md:grid-cols-4 md:grid-rows-2'>
        <NetOmzetCard
          generalNet={stats.generalNet}
          incomeReguler={stats.incomeReguler}
          paxReguler={stats.paxReguler}
          regulerBreakdown={stats.regulerBreakdown}
          incomePelajar={stats.incomePelajar}
          paxPelajar={stats.paxPelajar}
          pelajarBreakdown={stats.pelajarBreakdown}
          incomePaketan={stats.incomePaketan}
          paketanBreakdown={stats.paketanBreakdown}
          incomeEvent={stats.incomeEvent}
          paxEvent={stats.paxEvent}
          eventBreakdown={stats.eventBreakdown}
          incomeVoucher={stats.incomeVoucher}
          paxVoucher={stats.paxVoucher}
          voucherBreakdown={stats.voucherBreakdown}
          generalExpense={stats.generalExpense}
          dailyTarget={stats.dailyTarget}
          updateDailyTarget={stats.updateDailyTarget}
        />

        <StatsGrid
          txCount={stats.txCount}
          generalExpense={stats.generalExpense}
          qrisTotal={stats.qrisTotal}
          qrisCount={stats.qrisCount}
          qrisBreakdown={stats.qrisBreakdown}
          cashTotal={stats.cashTotal}
          cashCount={stats.cashCount}
          cashBreakdown={stats.cashBreakdown}
          websiteTotal={stats.websiteTotal}
          websiteCount={stats.websiteCount}
          websiteBreakdown={stats.websiteBreakdown}
        />

        <ExpenseBreakdown
          generalExpense={stats.generalExpense}
          dashboardDocs={stats.dashboardDocs}
        />
      </div>

      {/* WA Modal */}
      {isWAModalOpen && (
        <div
          className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in'
          onClick={() => setIsWAModalOpen(false)}
        >
          <div
            className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-4xl w-full max-w-sm animate-in zoom-in-95'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-between items-center mb-5'>
              <h3 className='font-bold text-zinc-900 dark:text-white text-xl'>
                Kirim Laporan WA
              </h3>
              <button
                onClick={() => setIsWAModalOpen(false)}
                className='text-zinc-400 hover:text-zinc-600 cursor-pointer'
              >
                ✕
              </button>
            </div>

            <button
              type='button'
              onClick={handleCopyOnly}
              className='flex justify-center items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 mb-4 py-3.5 rounded-2xl w-full font-extrabold text-white dark:text-zinc-900 text-sm transition-all cursor-pointer'
            >
              {copied ? 'Teks Laporan Disalin! ✅' : '📋 Salin Teks Rekap'}
            </button>

            <div className='mb-2 font-bold text-[10px] text-zinc-400 uppercase tracking-wider'>
              Atau Buka Chat WA Langsung ke:
            </div>

            <div className='space-y-2 mb-5'>
              {CONTACTS.map((c) => (
                <button
                  key={c.phone}
                  type='button'
                  onClick={() => handleOpenWhatsApp(c)}
                  className='group flex justify-between items-center bg-zinc-50 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-900/20 px-4 py-3.5 rounded-2xl w-full font-bold text-zinc-800 dark:text-zinc-100 transition-all cursor-pointer'
                >
                  <div className='flex flex-col items-start'>
                    <span>{c.name}</span>
                    <span className='font-medium text-[10px] text-zinc-400'>
                      {c.phone}
                    </span>
                  </div>
                  <span className='font-bold text-emerald-600 dark:text-emerald-400 text-xs'>
                    Buka WA →
                  </span>
                </button>
              ))}
            </div>

            <p className='opacity-60 text-[10px] text-zinc-500 text-center'>
              Format rekap otomatis terisi di kolom pesan WhatsApp tujuan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard