import React from 'react';

interface ToastProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ show, type, message }) => {
  if (!show) return null;
  return (
    <div className={`top-4 left-1/2 z-50 fixed max-w-[90%] shadow-lg px-5 py-3 rounded-2xl -translate-x-1/2 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      <div className='flex items-center gap-2'>
        <span className='text-lg'>{type === 'success' ? '✅' : '⚠️'}</span>
        <span className='font-semibold text-white text-sm'>{message}</span>
      </div>
    </div>
  );
};
