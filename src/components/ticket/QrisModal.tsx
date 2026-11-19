import React from 'react';

interface QrisModalProps {
  show: boolean;
  generatedQris: string | null;
  totalPrice: number;
  onClose: () => void;
}

export const QrisModal: React.FC<QrisModalProps> = ({ show, generatedQris, totalPrice, onClose }) => {
  if (!show) return null;

  return (
    <div className='z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in' onClick={onClose}>
      <div className='relative bg-white p-4 rounded-3xl w-full max-w-sm animate-in zoom-in-95' onClick={(e) => e.stopPropagation()}>
        <button type='button' onClick={onClose} className='top-4 right-4 absolute bg-zinc-100 hover:bg-zinc-200 rounded-full w-10 h-10 font-bold text-zinc-500 transition-colors'>
          ✕
        </button>
        <h3 className='mb-2 font-bold text-zinc-900 text-lg text-center'>Scan QRIS untuk Bayar</h3>
        <p className='mb-4 font-bold text-sky-600 text-xs text-center uppercase tracking-wider'>
          Total: Rp {totalPrice.toLocaleString('id-ID')}
        </p>

        <div className='flex justify-center items-center bg-zinc-100 mb-4 p-4 rounded-2xl'>
          {generatedQris ? (
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedQris)}`} alt='Scan QRIS' className='rounded-xl w-full' />
          ) : (
            <div className='py-20 text-center'>
              <div className='mx-auto mb-3 border-4 border-sky-500 border-t-transparent rounded-full w-10 h-10 animate-spin'></div>
              <p className='text-zinc-500 text-sm'>Generating QRIS...</p>
            </div>
          )}
        </div>

        <div className='bg-sky-50 mb-4 p-3 border border-sky-100 rounded-xl'>
          <p className='text-[11px] text-sky-800 text-center leading-relaxed'>
            Setelah bayar, status booking kamu akan diperbarui secara otomatis. Kamu juga akan menerima notifikasi WhatsApp.
          </p>
        </div>

        <button type='button' onClick={onClose} className='bg-zinc-900 py-3 rounded-xl w-full font-bold text-white'>
          Selesai
        </button>
      </div>
    </div>
  );
};
