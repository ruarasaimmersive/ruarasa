import React from 'react';

export const BookingHeader: React.FC = () => {
  return (
    <div className='top-0 z-30 sticky flex items-center gap-3 bg-white/80 backdrop-blur-xl p-4 border-zinc-100 border-b'>
      <a href='/' className='flex justify-center items-center bg-zinc-100 hover:bg-zinc-200 rounded-full w-9 h-9 text-zinc-500 hover:text-zinc-900 transition-colors'>
        ←
      </a>
      <div>
        <h1 className='font-black text-zinc-900 text-xl tracking-tight'>Rua Rasa</h1>
        <p className='text-zinc-500 text-xs'>Booking Tiket & Wahana</p>
      </div>
    </div>
  );
}
