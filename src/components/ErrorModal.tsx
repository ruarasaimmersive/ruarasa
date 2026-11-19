import React from 'react'

interface ErrorModalProps {
  isOpen: boolean
  message: string | null
  onClose: () => void
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  if (!isOpen || !message) return null

  return (
    <div
      onClick={onClose}
      className='z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm animate-in zoom-in-95'
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <circle cx='12' cy='12' r='10'></circle>
              <line x1='12' y1='8' x2='12' y2='12'></line>
              <line x1='12' y1='16' x2='12.01' y2='16'></line>
            </svg>
          </div>
          <h3 className='font-bold text-red-600 dark:text-red-400 text-xl'>
            Gagal Menyimpan
          </h3>
        </div>
        <div className='bg-zinc-100 dark:bg-zinc-950 mb-6 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-60 overflow-y-auto font-mono text-zinc-800 dark:text-zinc-300 text-xs word-break-break-word whitespace-pre-wrap select-text'>
          {message}
        </div>
        <button
          onClick={onClose}
          className='bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 py-3 rounded-xl w-full font-bold text-white dark:text-zinc-900 transition-colors cursor-pointer'
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

export default ErrorModal
