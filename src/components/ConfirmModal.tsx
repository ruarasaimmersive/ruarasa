import React from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info'
  isLoading?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Ya',
  cancelText = 'Batal',
  variant = 'info',
  isLoading = false,
}) => {
  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div
      onClick={onCancel}
      className='z-100 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-3xl w-full max-w-sm text-center animate-in zoom-in-95'
      >
        <div
          className={`flex justify-center items-center mx-auto mb-4 rounded-full w-16 h-16 text-3xl ${
            isDanger
              ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isDanger ? '⚠️' : 'ℹ️'}
        </div>
        <h2 className='mb-2 font-bold text-zinc-900 dark:text-white text-xl'>
          {title}
        </h2>
        <div className='mb-6 font-medium text-zinc-500 text-sm'>{message}</div>
        <div className='flex gap-3'>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 py-3 rounded-xl font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer disabled:cursor-not-allowed'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 shadow-lg py-3 rounded-xl font-bold text-white transition-colors ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isLoading ? (
              <div className='border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin' />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
