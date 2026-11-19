import React from 'react'
import type { SaleDoc } from '../../db'

interface HistoryTableProps {
  sales: SaleDoc[]
  currentCashier: string
  onEdit: (item: SaleDoc) => void
  onPrint?: (item: SaleDoc) => void
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  sales,
  currentCashier,
  onEdit,
  onPrint,
}) => {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm text-left'>
        <thead className='border-zinc-100 dark:border-zinc-800 border-b font-bold text-zinc-400 text-xs uppercase'>
          <tr>
            <th className='px-2 md:px-4 py-4 font-bold text-center tracking-wider'>
              Order
            </th>
            <th className='px-2 md:px-4 py-4 font-bold tracking-wider'>
              Info Produk
            </th>
            <th className='px-2 md:px-4 py-4 font-bold tracking-wider'>
              Cashier
            </th>
            <th className='px-2 md:px-4 py-4 font-bold tracking-wider'>
              Metode
            </th>
            <th className='px-2 md:px-4 py-4 font-bold tracking-wider'>
              Variasi
            </th>
            <th className='px-2 md:px-4 py-4 font-bold text-center tracking-wider'>
              Status
            </th>
            <th className='px-2 md:px-4 py-4 font-bold text-center tracking-wider'>
              Sync
            </th>
            <th className='px-2 md:px-4 py-4 font-bold text-right tracking-wider'>
              Harga
            </th>
            <th className='px-2 md:px-4 py-4 w-10'></th>
          </tr>
        </thead>
        <tbody className='divide-y divide-zinc-50 dark:divide-zinc-800/50'>
          {sales.map((s) => (
            <tr
              key={s.transaction_id}
              className={`group transition-all border-b border-zinc-50 dark:border-zinc-800/50 ${
                s.is_deleted
                  ? 'bg-red-50/30 dark:bg-red-900/10 opacity-60 decoration-red-500/50'
                  : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
              }`}
            >
              <td className='px-2 md:px-4 py-4 w-16 text-center'>
                <span className='inline-block bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg font-mono font-bold text-zinc-600 dark:text-zinc-400 text-xs'>
                  #{s.order_id || '?'}
                </span>
              </td>
              <td className='px-2 md:px-4 py-4'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`min-w-12 min-h-12 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-black/5 ${s.type === 'OUT' ? 'bg-red-50 text-red-500' : s.nama_barang.includes('Kid') ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}
                  >
                    {s.type === 'OUT'
                      ? '💸'
                      : s.nama_barang.includes('Kid')
                        ? '🎈'
                        : '🎫'}
                  </div>
                  <div>
                    <div
                      className={`font-bold text-zinc-900 dark:text-zinc-100 ${s.is_deleted ? 'line-through decoration-2 decoration-red-500/50' : ''}`}
                    >
                      {s.nama_barang}
                      {s.is_deleted && (
                        <span className='ml-2 text-red-500 text-xs no-underline'>
                          (Dihapus)
                        </span>
                      )}
                    </div>
                    <div className='font-medium text-zinc-400 text-xs'>
                      {new Date(s.tanggal).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </td>
              <td className='px-2 md:px-4 py-4'>
                <div className='inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full font-medium text-zinc-600 dark:text-zinc-400 text-xs'>
                  <span>👤</span>
                  {s.kasir || '-'}
                </div>
              </td>
              <td className='px-2 md:px-4 py-4'>
                <div className='font-bold text-zinc-700 dark:text-zinc-300 text-sm'>
                  {s.metode_pembayaran || 'CASH'}
                </div>
              </td>
              <td className='px-2 md:px-4 py-4'>
                <div className='font-medium text-xs'>
                  {(() => {
                    if (s.type === 'OUT')
                      return (
                        <span className='font-bold text-[10px] text-zinc-300'>
                          -
                        </span>
                      )

                    const variant = s.notes || 'REGULER'
                    if (variant === 'EVENT')
                      return (
                        <span className='bg-pink-100 dark:bg-pink-900/30 px-2 py-1 border border-pink-200 dark:border-pink-800 rounded-md font-bold text-[10px] text-pink-600 dark:text-pink-400 uppercase tracking-wide'>
                          EVENT
                        </span>
                      )
                    if (variant === 'PELAJAR')
                      return (
                        <span className='bg-amber-100 dark:bg-amber-900/30 px-2 py-1 border border-amber-200 dark:border-amber-800 rounded-md font-bold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide'>
                          Pelajar
                        </span>
                      )
                    if (variant === 'OUTING')
                      return (
                        <span className='bg-purple-100 dark:bg-purple-900/30 px-2 py-1 border border-purple-200 dark:border-purple-800 rounded-md font-bold text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wide'>
                          Outing
                        </span>
                      )
                    if (variant === 'VOUCHER')
                      return (
                        <span className='bg-teal-100 dark:bg-teal-900/30 px-2 py-1 border border-teal-200 dark:border-teal-800 rounded-md font-bold text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wide'>
                          Voucher
                        </span>
                      )
                    return (
                      <span className='bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md font-bold text-[10px] text-zinc-500 uppercase tracking-wide'>
                        {variant}
                      </span>
                    )
                  })()}
                </div>
              </td>

              {/* Status Pembayaran */}
              <td className='px-2 md:px-4 py-4 text-center whitespace-nowrap'>
                {s.type === 'OUT' ? (
                  <span className='bg-red-50 dark:bg-red-900/20 px-2 py-1 border border-red-100 dark:border-red-900/30 rounded-md font-bold text-[10px] text-red-500 uppercase tracking-wide'>
                    KELUAR
                  </span>
                ) : (
                  <span className='bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 border border-emerald-200 dark:border-emerald-800 rounded-md font-bold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide'>
                    Lunas
                  </span>
                )}
              </td>

              {/* Sync Status */}
              <td className='px-2 md:px-4 py-4 text-center'>
                {s.is_synced ? (
                  <span
                    className='inline-flex justify-center items-center bg-zinc-50 border border-zinc-200 rounded-full w-8 h-8 text-emerald-500'
                    title='Synced'
                  >
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                    >
                      <polyline points='20 6 9 17 4 12' />
                    </svg>
                  </span>
                ) : (
                  <span
                    className='inline-flex justify-center items-center bg-amber-50 border border-amber-200 rounded-full w-8 h-8 text-amber-500 animate-pulse'
                    title='Pending'
                  >
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                    >
                      <circle cx='12' cy='12' r='10' />
                      <line x1='12' y1='8' x2='12' y2='12' />
                      <line x1='12' y1='16' x2='12.01' y2='16' />
                    </svg>
                  </span>
                )}
              </td>
              <td className='px-2 md:px-4 py-4 text-right'>
                <div
                  className={`font-bold ${s.type === 'OUT' ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}
                >
                  Rp {s.total_harga.toLocaleString('id-ID')}
                </div>
                <div className='font-medium text-zinc-400 text-xs'>
                  {s.qty} item
                </div>
              </td>
              <td className='px-2 md:px-4 py-4'>
                <div className='flex justify-end gap-2'>
                  {!s.is_deleted ? (
                    <>
                      {s.type === 'IN' && onPrint && (
                        <button
                          onClick={() => onPrint(s)}
                          className='hover:bg-zinc-100 p-2 rounded-lg text-zinc-300 hover:text-zinc-600 transition-all cursor-pointer'
                          title='Cetak Ulang Struk'
                        >
                          <svg
                            width='18'
                            height='18'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                          >
                            <polyline points='6 9 6 2 18 2 18 9' />
                            <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' />
                            <rect x='6' y='14' width='12' height='8' />
                          </svg>
                        </button>
                      )}
                      {currentCashier === s.kasir && (
                        <button
                          onClick={() => onEdit(s)}
                          className='hover:bg-zinc-100 p-2 rounded-lg text-zinc-300 hover:text-zinc-600 transition-all cursor-pointer'
                          title='Edit / Hapus'
                        >
                          <svg
                            width='18'
                            height='18'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                          >
                            <path d='M12 20h9' />
                            <path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className='flex items-center text-red-300 dark:text-red-900/40'>
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                      >
                        <path d='M18 6 6 18' />
                        <path d='m6 6 12 12' />
                      </svg>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
