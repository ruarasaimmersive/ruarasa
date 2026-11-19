import React from 'react'

export const PaymentMethodSelect: React.FC = () => {
  return (
    <>
      <h2 className='mb-3 font-bold text-[10px] text-sky-600 uppercase tracking-widest'>
        💳 Metode Pembayaran
      </h2>
      <div className='space-y-3 mb-8'>
        <div className='flex items-center gap-3 bg-sky-50/50 p-3.5 border border-sky-200 rounded-2xl font-extrabold text-sky-700 text-sm'>
          <span className='text-xl'>🤳</span>
          <span>QRIS (Otomatis & Instan)</span>
        </div>
        <div className='bg-sky-50 p-4 border border-sky-100 rounded-xl text-left'>
          <p className='flex items-center gap-1.5 mb-2.5 font-bold text-sky-800 text-sm'>
            <span>⚡</span> Kelebihan Bayar via QRIS Otomatis:
          </p>
          <ul className='space-y-1.5 mb-4 pl-4 text-sky-700 text-xs leading-relaxed list-disc'>
            <li>
              <strong>Konfirmasi Instan:</strong> Pembayaran Anda
              terverifikasi secara otomatis oleh sistem dalam hitungan detik.
            </li>
            <li>
              <strong>Langsung Masuk:</strong> Tidak perlu antre lama di kasir
              untuk membayar, Anda bisa langsung masuk ke wahana dengan hanya
              mengonfirmasi ke lobby saja.
            </li>
            <li>
              <strong>Mendukung Banyak Aplikasi:</strong> Bisa di-scan
              menggunakan GoPay, OVO, Dana, ShopeePay, serta semua aplikasi
              Mobile Banking.
            </li>
          </ul>
          <div className='pt-3 border-sky-100/50 border-t text-[11px] text-sky-600 leading-relaxed'>
            <p className='mb-0.5 font-bold text-sky-800'>
              Kenapa ada Platform Fee?
            </p>
            Biaya platform Rp 2.500/tiket digunakan untuk biaya integrasi
            gerbang pembayaran otomatis (Payment Gateway) pihak ketiga demi
            memproses transaksi secara real-time, aman, dan instan.
          </div>
        </div>
      </div>
    </>
  )
}
