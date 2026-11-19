import React, { useState, useEffect } from 'react'
import type { SaleDoc } from '../../db'
import { DEFAULT_TICKET_PACKAGES } from '../../constants'

interface TransactionEditModalProps {
  item: SaleDoc
  onClose: () => void
  onSave: (updatedItem: SaleDoc) => Promise<void>
  onDelete: () => void
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  item,
  onClose,
  onSave,
  onDelete,
}) => {
  const [localItem, setLocalItem] = useState<SaleDoc>({ ...item })

  useEffect(() => {
    setLocalItem({ ...item })
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(localItem)
  }

  return (
    <div
      onClick={onClose}
      className='z-60 fixed inset-0 flex justify-center items-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in duration-300 fade-in'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-4xl w-full max-w-sm scale-100 animate-in duration-300 zoom-in-95'
      >
        <div className='flex justify-between items-center mb-6'>
          <h3 className='font-bold text-xl'>Edit Transaksi</h3>
          <button
            onClick={onClose}
            className='flex justify-center items-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full w-8 h-8 transition-colors cursor-pointer'
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {localItem.type === 'OUT' ? (
            // --- EXPENSE EDIT FORM ---
            <>
              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  KETERANGAN PENGELUARAN
                </label>
                <input
                  type='text'
                  className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-bold text-lg'
                  value={localItem.nama_barang}
                  onChange={(e) =>
                    setLocalItem({
                      ...localItem,
                      nama_barang: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  NOMINAL (RP)
                </label>
                <input
                  type='text'
                  className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-bold text-lg'
                  value={localItem.total_harga.toLocaleString('id-ID')}
                  onChange={(e) =>
                    setLocalItem({
                      ...localItem,
                      total_harga: Number(e.target.value.replace(/\D/g, '')),
                    })
                  }
                />
              </div>
            </>
          ) : (
            // --- PRODUCT/DP EDIT FORM ---
            <>
              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  PRODUK
                </label>
                <div className='relative'>
                  <select
                    className='bg-zinc-50 dark:bg-zinc-800 p-4 border-transparent rounded-xl outline-none ring-emerald-500/50 focus:ring-2 w-full font-bold text-lg appearance-none'
                    value={localItem.nama_barang}
                    onChange={(e) =>
                      setLocalItem({
                        ...localItem,
                        nama_barang: e.target.value,
                      })
                    }
                  >
                    <option value='Immersive Edupark'>Immersive Edupark</option>
                    <option value='Immersive Edupark (Hemat)'>
                      Immersive Edupark (Hemat)
                    </option>
                  </select>
                  <div className='top-1/2 right-4 absolute text-zinc-400 -translate-y-1/2 pointer-events-none'>
                    ▼
                  </div>
                </div>
              </div>

              <div className='gap-4 grid grid-cols-2'>
                <div>
                  <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                    QTY
                  </label>
                  <input
                    type='number'
                    min='1'
                    className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-bold text-lg text-center'
                    value={localItem.qty}
                    onChange={(e) =>
                      setLocalItem({
                        ...localItem,
                        qty: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                    METODE
                  </label>
                  <select
                    className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-bold text-lg text-center appearance-none'
                    value={localItem.metode_pembayaran}
                    onChange={(e) =>
                      setLocalItem({
                        ...localItem,
                        metode_pembayaran: e.target.value,
                      })
                    }
                  >
                    <option value='CASH'>CASH</option>
                    <option value='QRIS'>QRIS</option>
                    <option value='Website'>Website</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  VARIANT
                </label>
                <div className='gap-2 grid grid-cols-2 md:grid-cols-4'>
                  {DEFAULT_TICKET_PACKAGES.map((v) => {
                    const currentVariant =
                      localItem.variant || localItem.notes || ''
                    const isActive =
                      currentVariant === v.variant &&
                      localItem.harga_satuan === v.nominal
                    return (
                      <button
                        key={v.id}
                        type='button'
                        onClick={() =>
                          setLocalItem({
                            ...localItem,
                            variant: v.variant,
                            notes: v.variant,
                            harga_satuan: v.nominal,
                          })
                        }
                        className={`py-2 px-1 rounded-xl border-2 font-bold text-[10px] transition-all cursor-pointer ${
                          isActive
                            ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-100 shadow-md scale-105'
                            : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        {v.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  HARGA SATUAN
                </label>
                <input
                  type='text'
                  className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-bold text-lg text-center'
                  value={localItem.harga_satuan.toLocaleString('id-ID')}
                  onChange={(e) =>
                    setLocalItem({
                      ...localItem,
                      harga_satuan: Number(e.target.value.replace(/\D/g, '')),
                    })
                  }
                />
              </div>

              <div>
                <label className='block mb-1 pl-3 font-bold text-zinc-400 text-xs'>
                  NOMOR HP
                </label>
                <input
                  type='tel'
                  className='bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none w-full font-medium text-center'
                  value={localItem.nomor_hp || ''}
                  onChange={(e) =>
                    setLocalItem({
                      ...localItem,
                      nomor_hp: e.target.value,
                    })
                  }
                  placeholder='-'
                />
              </div>
            </>
          )}

          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onDelete}
              className='hover:bg-red-50 px-6 py-4 rounded-2xl font-extrabold text-red-500 transition-colors cursor-pointer'
            >
              Hapus
            </button>
            <button
              type='submit'
              className='flex-1 bg-zinc-900 dark:bg-white shadow-xl py-4 rounded-2xl font-extrabold text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer'
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
