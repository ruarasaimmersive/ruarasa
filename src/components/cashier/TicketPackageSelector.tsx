import React from 'react'
import type { TicketPackage, PackageGroup } from '../PackageKanban'
import { getPricing } from '../../utils/pricing'

interface TicketPackageSelectorProps {
  products: any[]
  selectedProduct: any
  setSelectedProduct: (prod: any) => void
  groups: PackageGroup[]
  packages: TicketPackage[]
  activeGroup: string
  setActiveGroup: (groupId: string) => void
  activePkg: TicketPackage | null
  setActivePkg: (pkg: TicketPackage | null) => void
  qty: number
  currentTime: Date
}

export const TicketPackageSelector: React.FC<TicketPackageSelectorProps> = ({
  products,
  selectedProduct,
  setSelectedProduct,
  groups,
  packages,
  activeGroup,
  setActiveGroup,
  activePkg,
  setActivePkg,
  qty,
  currentTime,
}) => {
  return (
    <div className='mb-8'>
      <div className='flex gap-4'>
        {products
          .filter((p) => p.name.includes('Bundling') || p.name.includes('Immersive'))
          .slice(0, 1)
          .map((p) => {
            const isSelected =
              selectedProduct && selectedProduct.name === p.name
            const isImmersive =
              p.name.toLowerCase().includes('immersive') ||
              p.name.toLowerCase().includes('tiket')

            return (
              <div
                key={p.name}
                onClick={() => setSelectedProduct(p)}
                className={`relative flex-1 group transition-all duration-300 rounded-3xl p-4 border-2 flex flex-col items-start cursor-pointer outline-none focus:ring-4 ring-offset-2 dark:ring-offset-zinc-900 ${
                  isSelected
                    ? `border-transparent ${p.color} pattern-cultural text-white shadow-xl ${p.shadow} scale-[1.02] ring-2 ring-white/20`
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 ring-zinc-200'
                }`}
              >
                <div className='flex items-center gap-4 w-full'>
                  <div
                    className={`text-4xl w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm shadow-inner ${
                      isSelected
                        ? 'bg-white/20'
                        : 'bg-zinc-100 dark:bg-zinc-700'
                    }`}
                  >
                    {p.emoji}
                  </div>
                  <div className='flex-1 text-left'>
                    <div
                      className={`font-extrabold text-xl leading-tight ${
                        isSelected
                          ? 'text-white'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      Tiket Ruarasa
                    </div>
                    {!isImmersive && (
                      <div
                        className={`text-sm font-bold mt-1 ${
                          isSelected
                            ? 'text-white/90'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>

                {isImmersive && (
                  <div className='mt-4 w-full'>
                    {/* MODE TOGGLE (Groups) */}
                    <div className='flex bg-black/5 dark:bg-black/20 mb-2 p-1 rounded-xl overflow-x-auto snap-x'>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveGroup(g.id)
                            const firstPkg = packages.find(
                              (p) => p.groupId === g.id,
                            )
                            if (firstPkg) setActivePkg(firstPkg)
                          }}
                          className={`flex-1 min-w-max px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all snap-start ${
                            activeGroup === g.id
                              ? g.name.toLowerCase() === 'ramadhan'
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                              : isSelected
                                ? 'text-white/60 hover:text-white'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>

                    {/* Package List based on activeGroup */}
                    <div className='flex flex-wrap gap-2'>
                      {packages
                        .filter((p) => p.groupId === activeGroup)
                        .map((pkg) => {
                          const { unitReal: previewReal } = getPricing(
                            pkg,
                            qty,
                            p,
                            currentTime,
                          )

                          return (
                            <button
                              key={pkg.id}
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                setActivePkg(pkg)
                              }}
                              className={`flex-1 min-w-[30%] flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                                activePkg?.id === pkg.id
                                  ? 'bg-white border-emerald-500 text-emerald-600 shadow-md scale-[1.03]'
                                  : isSelected
                                    ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                                    : 'bg-zinc-50 dark:bg-zinc-700 border-zinc-100 dark:border-zinc-600 text-zinc-500'
                              }`}
                            >
                              <div className='px-1 w-full font-bold text-[10px] text-center truncate leading-tight'>
                                {pkg.name}
                              </div>
                              <div className='font-black text-xs'>
                                {(previewReal / 1000).toLocaleString('id-ID')}
                                rb
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
