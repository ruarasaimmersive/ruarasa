import React, { useState } from 'react'
import { useSalesSync } from '../hooks/useSalesSync'
import { HistoryTable } from './history/HistoryTable'
import { TransactionEditModal } from './history/TransactionEditModal'
import ConfirmModal from './ConfirmModal'
import { PrintReceipt } from './PrintReceipt'

const History = () => {
  const {
    sales,
    currentCashier,
    isSyncing,
    editingItem,
    setEditingItem,
    confirmConfig,
    showToast,
    setShowToast,
    closeConfirm,
    handleDeleteAll,
    handleSync,
    handleFetchServerData,
    handleEdit,
    saveEdit,
    deleteItem,
  } = useSalesSync()

  const [printSale, setPrintSale] = useState<any[] | null>(null)

  const handlePrintReceipt = async (saleItem: any) => {
    try {
      const datePrefix = saleItem.tanggal.substring(0, 10)
      const sameDaySales = sales
        .filter((s: any) => s.type === 'IN' && s.tanggal.startsWith(datePrefix))
        .sort((a: any, b: any) => (a.order_id || 0) - (b.order_id || 0))
      
      const idx = sameDaySales.findIndex((s: any) => s.transaction_id === saleItem.transaction_id)
      const dailySeq = idx !== -1 ? idx + 1 : 1

      const printItem = {
        ...saleItem,
        daily_sequence: dailySeq
      }

      setPrintSale([printItem])
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
    } catch (err) {
      console.error('[handlePrintReceipt] Error:', err)
    }
  }

  return (
    <div className='slide-in-from-bottom-4 space-y-0 md:space-y-6 mx-auto w-full max-w-7xl animate-in duration-500 fade-in'>
      {/* Header Panel */}
      <div className='top-0 z-10 md:static sticky flex md:flex-row flex-col justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl p-6 border-zinc-200 dark:border-zinc-800 border-b md:border-b-0 rounded-none md:rounded-4xl md:glass-card'>
        <div className='flex items-center gap-4'>
          <div className='flex justify-center items-center bg-amber-100 dark:bg-amber-900/40 shadow-inner rounded-2xl w-12 h-12 text-amber-600 dark:text-amber-400 text-xl'>
            📚
          </div>
          <div>
            <h1 className='font-bold text-zinc-900 dark:text-white text-xl'>
              Riwayat Transaksi
            </h1>
            <div className='flex items-center gap-2 font-medium text-zinc-500 text-sm'>
              Total:{' '}
              <span className='font-bold text-zinc-900 dark:text-zinc-100'>
                {sales.length}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-2 w-full md:w-auto'>
          <button
            onClick={handleDeleteAll}
            className='flex justify-center items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl font-bold text-red-500 hover:text-red-600 text-sm transition-colors cursor-pointer'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
            </svg>
            Hapus
          </button>

          {sales.length > 0 && (
            <button
              onClick={handleSync}
              className='flex flex-1 md:flex-none justify-center items-center gap-2 bg-zinc-900 dark:bg-white shadow-lg shadow-zinc-900/10 px-5 py-2.5 rounded-xl font-bold text-white dark:text-zinc-900 text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer'
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                <polyline points='7 10 12 15 17 10' />
                <line x1='12' y1='15' x2='12' y2='3' />
              </svg>
              Sync Data
            </button>
          )}

          {/* GET DATA (Any Role & Empty Local Data) */}
          {sales.length === 0 && (
            <button
              onClick={handleFetchServerData}
              disabled={isSyncing}
              className='flex flex-1 md:flex-none justify-center items-center gap-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 px-5 py-2.5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer'
            >
              {isSyncing ? (
                <div className='border-2 border-emerald-600 border-t-transparent rounded-full w-4 h-4 animate-spin' />
              ) : (
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='17 8 12 3 7 8' />
                  <line x1='12' y1='3' x2='12' y2='15' />
                </svg>
              )}
              Get Data
            </button>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showToast.show && (
        <div
          onClick={() => setShowToast({ ...showToast, show: false })}
          className='z-60 fixed inset-0 flex justify-center items-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in duration-300 fade-in'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-3xl w-full max-w-sm scale-100 animate-in duration-300 zoom-in-95'
          >
            <div className='flex flex-col items-center gap-4 text-center'>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                  showToast.variant === 'success'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {showToast.variant === 'success' ? '✅' : '❌'}
              </div>
              <div>
                <h3 className='mb-2 font-bold text-zinc-900 dark:text-white text-xl'>
                  {showToast.variant === 'success' ? 'Berhasil' : 'Gagal'}
                </h3>
                <p className='font-medium text-zinc-500 dark:text-zinc-400'>
                  {showToast.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setShowToast((prev) => ({ ...prev, show: false }))
                }
                className='bg-zinc-900 dark:bg-white mt-2 px-6 py-3 rounded-xl w-full font-bold text-white dark:text-zinc-900 cursor-pointer'
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List / Table */}
      <div className='bg-transparent p-0 md:p-1 md:rounded-4xl min-h-[50vh] overflow-hidden md:glass-card'>
        {sales.length === 0 ? (
          <div className='flex flex-col justify-center items-center opacity-50 py-20 min-h-[50vh]'>
            <div className='mb-4 text-4xl animate-bounce'>💤</div>
            <p className='font-bold text-zinc-500'>Belum ada transaksi</p>
            <p className='mt-2 text-zinc-400 text-xs'>
              Login sebagai: {currentCashier}
            </p>
          </div>
        ) : (
          <HistoryTable
            sales={sales}
            currentCashier={currentCashier}
            onEdit={handleEdit}
            onPrint={handlePrintReceipt}
          />
        )}
      </div>

      {/* Edit Modal (Redesigned) */}
      {editingItem && (
        <TransactionEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={saveEdit}
          onDelete={deleteItem}
        />
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
        isLoading={isSyncing}
      />
      {/* Hidden print container for thermal receipt printer */}
      {printSale && (
        <PrintReceipt sales={printSale} />
      )}
    </div>
  )
}

export default History
