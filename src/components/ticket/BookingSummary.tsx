import React from 'react';

interface BookingSummaryProps {
  totalItems: number;
  totalPrice: number;
  platformFee: number;
  isSubmitting: boolean;
  paymentMethod: 'ONSITE' | 'TRANSFER';
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ totalItems, totalPrice, platformFee, isSubmitting, paymentMethod }) => {
  const grandTotal = totalPrice + platformFee;

  return (
    <div className='sticky bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-zinc-200 border-t w-full shadow-[0_-8px_30px_rgba(0,0,0,0.08)]'>
      <div className='mx-auto max-w-lg'>
        {totalItems > 0 && (
          <div className='flex flex-col gap-1.5 mb-3 border-zinc-100 pb-2.5 border-b text-xs'>
            <div className='flex justify-between text-zinc-500'>
              <span>Harga Tiket ({totalItems}x)</span>
              <span className='font-semibold text-zinc-800'>Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            {paymentMethod === 'TRANSFER' && platformFee > 0 && (
              <div className='flex justify-between text-zinc-500'>
                <span>Platform Fee (QRIS)</span>
                <span className='font-semibold text-zinc-700'>Rp {platformFee.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        )}
        <div className='flex justify-between items-center mb-4.5'>
          <div className='text-zinc-500 text-xs font-bold'>
            Total Bayar
          </div>
          <div className='font-black text-zinc-950 text-xl'>
            Rp {grandTotal.toLocaleString('id-ID')}
          </div>
        </div>
        <button
          type='submit'
          disabled={isSubmitting || totalItems === 0}
          className='bg-zinc-900 hover:bg-sky-600 disabled:bg-zinc-300 shadow-xl shadow-zinc-200 hover:shadow-sky-500/20 py-3.5 rounded-xl w-full font-black text-white disabled:text-zinc-500 text-lg active:scale-[0.98] disabled:scale-100 transition-all cursor-pointer disabled:cursor-not-allowed'
        >
          {isSubmitting
            ? 'Memproses...'
            : paymentMethod === 'TRANSFER'
              ? 'Buat QRIS & Bayar Sekarang'
              : 'Booking Sekarang →'}
        </button>
        <p className='mt-2.5 text-[10px] text-zinc-500 text-center leading-relaxed'>
          {paymentMethod === 'TRANSFER'
            ? 'QRIS akan di-generate setelah konfirmasi. Pembayaran dikonfirmasi otomatis.'
            : 'Pembayaran dilakukan onsite (di kasir). Tunjukkan bukti booking ini.'}
        </p>
      </div>
    </div>
  );
};
