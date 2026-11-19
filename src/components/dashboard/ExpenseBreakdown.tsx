import React from 'react'
import type { SaleDoc } from '../../db'

interface ExpenseBreakdownProps {
  generalExpense: number
  dashboardDocs: SaleDoc[]
}

export const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({
  generalExpense,
  dashboardDocs,
}) => {
  if (generalExpense <= 0) return null

  return (
    <div className='slide-in-from-bottom-2 col-span-2 md:col-span-4 bg-red-50/50 dark:bg-red-900/10 mt-2 p-6 rounded-3xl animate-in fade-in'>
      <h3 className='flex items-center gap-2 mb-4 font-bold text-red-500/80 text-sm uppercase tracking-wider'>
        <span className='inline-block bg-red-500 rounded-full w-2 h-2'></span>
        Rincian Pengeluaran
      </h3>
      <div className='gap-2 grid grid-cols-1 md:grid-cols-2'>
        {dashboardDocs
          .filter((s) => s.type === 'OUT')
          .sort(
            (a, b) =>
              new Date(b.tanggal).getTime() -
              new Date(a.tanggal).getTime(),
          )
          .map((s) => (
            <div
              key={s.transaction_id}
              className='flex justify-between items-center bg-white dark:bg-zinc-800 shadow-sm p-3 border border-red-100 dark:border-red-900/30 rounded-xl text-xs'
            >
              <div className='flex flex-col'>
                <span className='font-bold text-zinc-700 dark:text-zinc-200'>
                  {s.nama_barang}
                </span>
                <span className='text-[10px] text-zinc-400'>
                  {new Date(s.tanggal).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className='font-bold text-red-500'>
                Rp {s.total_harga.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
