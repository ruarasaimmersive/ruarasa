import React from 'react'
import type { ProductDoc } from '../../db'

interface ProductSelectProps {
  products: ProductDoc[]
  cart: { [key: string]: number }
  onUpdateQty: (productName: string, delta: number) => void
}

const isDiscountActive = () => {
  const today = new Date()
  const endDiscountDate = new Date('2026-05-07T23:59:59+08:00')
  return today <= endDiscountDate
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  products,
  cart,
  onUpdateQty,
}) => {
  const isMainProduct = (name: string) =>
    name.includes('Immersive') ||
    name.includes('Bundling') ||
    name.includes('All In')

  const immersiveProducts = products
    .filter((p) => isMainProduct(p.name))
    .sort((a, b) => a.price - b.price)


  const otherProducts = products.filter(
    (p) => !isMainProduct(p.name),
  )

  return (
    <>
      <h2 className='mb-3 font-bold text-[10px] text-sky-600 uppercase tracking-widest'>
        🎫 Pilih Tiket
      </h2>
      <div className='space-y-3 mb-6'>
        {/* Render Group: Tiket Immersive & Bundling */}
        {immersiveProducts.length > 0 && (
          <div className='bg-white shadow-sm p-4 border-2 border-zinc-200 rounded-2xl'>
            <div className='flex items-center gap-3 mb-4 pb-3 border-zinc-100 border-b'>
              <div className='flex justify-center items-center bg-sky-50 rounded-xl w-10 h-10 text-sky-500 text-xl'>
                🎫
              </div>
              <div>
                <h3 className='font-extrabold text-zinc-900 text-base leading-tight'>
                  Tiket Immersive & Bundling
                </h3>
                <p className='mt-0.5 text-zinc-400 text-xs'>
                  Pilih opsi paket tiket yang diinginkan
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              {immersiveProducts.map((p) => {
                const qty = cart[p.name] || 0
                return (
                  <div
                    key={p.id || p.name}
                    className={`flex justify-between items-center p-3 rounded-xl border transition-all duration-350 ${qty > 0 ? 'bg-sky-50/40 border-sky-400 shadow-sm' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'}`}
                  >
                    <div>
                      <h4 className='font-bold text-zinc-800 text-sm'>
                        {p.name}
                      </h4>
                      <p className='mt-0.5 font-bold text-sky-600 text-xs'>
                        Rp {p.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className='flex items-center gap-1 bg-zinc-200/60 p-0.5 rounded-lg'>
                      <button
                        type='button'
                        onClick={() => onUpdateQty(p.name, -1)}
                        className='flex justify-center items-center bg-white hover:bg-zinc-100 shadow-sm rounded-md w-7 h-7 font-bold text-zinc-500 transition-colors cursor-pointer'
                      >
                        -
                      </button>
                      <span className='w-6 font-bold text-zinc-800 text-xs text-center'>
                        {qty}
                      </span>
                      <button
                        type='button'
                        onClick={() => onUpdateQty(p.name, 1)}
                        className='flex justify-center items-center bg-sky-500 hover:bg-sky-600 shadow-sm rounded-md w-7 h-7 font-bold text-white transition-colors cursor-pointer'
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

{/* Render Other Products (Future proof) */}
        {otherProducts.map((p) => {
          const qty = cart[p.name] || 0
          return (
            <div
              key={p.id}
              className={`group relative overflow-hidden rounded-xl border-2 p-3 transition-all duration-300 ${qty > 0 ? 'bg-sky-50 border-sky-500 shadow-lg shadow-sky-500/10' : 'bg-white border-zinc-200 hover:border-sky-300'}`}
            >
              <div className='z-10 relative flex justify-between items-center gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex justify-center items-center bg-zinc-100 rounded-xl w-12 h-12 text-xl'>
                    {p.emoji}
                  </div>
                  <div>
                    <h3 className='font-bold text-zinc-900 text-sm md:text-base leading-tight'>
                      {p.name}
                    </h3>
                    <p className='font-bold text-sky-600 text-xs md:text-sm'>
                      Rp {p.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-1 bg-zinc-100 p-1 rounded-lg'>
                  <button
                    type='button'
                    onClick={() => onUpdateQty(p.name, -1)}
                    className='flex justify-center items-center bg-white hover:bg-zinc-200 shadow-sm rounded-md w-7 h-7 font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer'
                  >
                    -
                  </button>
                  <span className='w-6 font-bold text-zinc-900 text-sm text-center'>
                    {qty}
                  </span>
                  <button
                    type='button'
                    onClick={() => onUpdateQty(p.name, 1)}
                    className='flex justify-center items-center bg-sky-500 hover:bg-sky-600 shadow-sm rounded-md w-7 h-7 font-bold text-white transition-colors cursor-pointer'
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
