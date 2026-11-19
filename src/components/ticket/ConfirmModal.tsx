import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  phone: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ show, phone, onClose, onConfirm }) => {
  if (!show) return null;

  const formatPhoneDisplay = (num: string) => {
    if (!num) return '';
    return `+62${num}`;
  };

  return (
    <div className='z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4' onClick={onClose}>
      <div className='bg-white shadow-2xl p-6 rounded-2xl w-full max-w-sm' onClick={(e) => e.stopPropagation()}>
        <div className='mb-4 text-center'>
          <div className='flex justify-center items-center bg-sky-100 mx-auto mb-3 rounded-full w-14 h-14'>
            <span className='text-2xl'>📱</span>
          </div>
          <h3 className='font-bold text-zinc-900 text-lg'>Konfirmasi Nomor WhatsApp</h3>
          <p className='mt-2 text-zinc-500 text-sm'>Informasi tiket akan dikirim ke:</p>
          <p className='mt-2 font-bold text-sky-600 text-xl'>{formatPhoneDisplay(phone)}</p>
        </div>
        <p className='mb-5 text-zinc-400 text-xs text-center'>Pastikan nomor WhatsApp sudah benar sebelum melanjutkan.</p>
        <div className='gap-3 grid grid-cols-2'>
          <button type='button' onClick={onClose} className='bg-zinc-100 hover:bg-zinc-200 px-4 py-3 rounded-xl font-semibold text-zinc-700 text-sm transition-colors'>
            Ubah Nomor
          </button>
          <button type='button' onClick={onConfirm} className='bg-sky-500 hover:bg-sky-600 px-4 py-3 rounded-xl font-semibold text-white text-sm transition-colors'>
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
