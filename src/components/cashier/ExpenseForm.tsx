import React from 'react'

interface ExpenseFormProps {
  expenseNote: string
  setExpenseNote: (note: string) => void
  expenseAmount: string
  setExpenseAmount: (amount: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expenseNote,
  setExpenseNote,
  expenseAmount,
  setExpenseAmount,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className='space-y-6 slide-in-from-left-4 animate-in duration-300 fade-in'>
      <div className='bg-red-50 dark:bg-red-900/10 p-6 border border-red-100 dark:border-red-900/20 rounded-3xl'>
        <div className='mb-4'>
          <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
            Keterangan Pengeluaran
          </label>
          <textarea
            value={expenseNote}
            onChange={(e) => setExpenseNote(e.target.value)}
            placeholder='Contoh: Kasbon Om Ang'
            rows={3}
            className='bg-white dark:bg-zinc-800 p-4 rounded-xl w-full font-bold text-zinc-900 dark:text-white resize-none'
          />
        </div>
        <div>
          <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
            Nominal (Rp)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={expenseAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              setExpenseAmount(val ? parseInt(val).toLocaleString('id-ID') : '')
            }}
            placeholder='0'
            className='bg-white dark:bg-zinc-800 p-4 rounded-xl w-full font-black text-zinc-900 dark:text-white text-3xl'
          />
        </div>
      </div>

      {/* SUBMIT BUTTON FOR OUT */}
      <button
        type='button'
        onClick={onSubmit}
        disabled={isSubmitting}
        className='flex justify-center items-center gap-2 bg-red-600 dark:bg-red-600 disabled:opacity-70 shadow-red-600/20 shadow-xl hover:shadow-2xl mt-4 py-5 rounded-2xl w-full font-black text-white text-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed'
      >
        {isSubmitting ? (
          <div className='border-4 border-white/30 border-t-white rounded-full w-6 h-6 animate-spin'></div>
        ) : (
          'Simpan Pengeluaran →'
        )}
      </button>
    </div>
  )
}
