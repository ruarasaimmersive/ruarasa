import React from 'react'

interface PaymentSelectorProps {
  total: number
  paymentMethod: string
  setPaymentMethod: (method: string) => void
}

const PAYMENTS = [
  {
    id: 'CASH',
    label: 'CASH',
    icon: (active: boolean) => (
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        className={active ? 'text-emerald-500' : 'text-zinc-400'}
      >
        <rect x='2' y='5' width='20' height='14' rx='2' />
        <line x1='2' y1='10' x2='22' y2='10' />
      </svg>
    ),
  },
  {
    id: 'QRIS',
    label: 'QRIS',
    icon: (active: boolean) => (
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        className={active ? 'text-blue-500' : 'text-zinc-400'}
      >
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
      </svg>
    ),
  },
]

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  total,
  paymentMethod,
  setPaymentMethod,
}) => {
  return (
    <div className='bg-amber-50 dark:bg-amber-900/10 mb-6 p-6 border border-amber-100 dark:border-amber-900/20 rounded-3xl'>
      <div className='mb-6'>
        <div className='opacity-70 mb-1 font-bold text-amber-600 dark:text-amber-500 text-xs tracking-widest'>
          TOTAL TAGIHAN
        </div>
        <div className='font-extrabold text-zinc-900 dark:text-zinc-100 text-3xl'>
          Rp {total.toLocaleString('id-ID')}
        </div>
      </div>

      <div className='gap-3 grid grid-cols-2 mb-6'>
        {PAYMENTS.map((pay) => {
          const isActive = paymentMethod === pay.id
          return (
            <button
              key={pay.id}
              type='button'
              onClick={() => setPaymentMethod(pay.id)}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300'
              }`}
            >
              {pay.icon(isActive)}
              <span
                className={`font-extrabold text-lg ${
                  isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {pay.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
