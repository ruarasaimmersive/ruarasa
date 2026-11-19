import React from 'react'

interface QuantitySelectorProps {
  qty: number
  setQty: (qty: number) => void
  handleInc: () => void
  handleDec: () => void
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  qty,
  setQty,
  handleInc,
  handleDec,
}) => {
  return (
    <div className='flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 shadow-inner mb-8 p-2 border border-zinc-100 dark:border-zinc-800 rounded-3xl'>
      <button
        type='button'
        onClick={handleDec}
        className='flex justify-center items-center bg-white dark:bg-zinc-800 shadow-md border-2 border-zinc-200 hover:border-red-500 dark:border-zinc-700 rounded-2xl w-16 h-16 font-extrabold text-zinc-600 hover:text-red-500 dark:text-zinc-300 text-3xl active:scale-95 transition-all cursor-pointer select-none'
      >
        −
      </button>
      <div className='flex-1 text-center'>
        <div className='mb-1 font-extrabold text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
          TOTAL TIKET
        </div>
        <input
          type='number'
          min='1'
          value={qty}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            if (!isNaN(val) && val > 0) setQty(val)
            else if (e.target.value === '') setQty(0) // Allow empty temporarily
          }}
          onBlur={() => {
            if (qty === 0) setQty(1)
          }}
          className='bg-transparent m-0 p-0 outline-none w-full font-mono font-black text-zinc-900 dark:text-white text-5xl text-center appearance-none'
          style={{ MozAppearance: 'textfield' }}
        />
      </div>
      <button
        type='button'
        onClick={handleInc}
        className='flex justify-center items-center bg-zinc-900 dark:bg-white shadow-xl shadow-zinc-900/30 rounded-2xl focus:ring-2 ring-offset-2 w-16 h-16 font-extrabold text-white dark:text-zinc-900 text-3xl hover:scale-105 active:scale-90 transition-all cursor-pointer select-none'
      >
        ＋
      </button>
    </div>
  )
}
