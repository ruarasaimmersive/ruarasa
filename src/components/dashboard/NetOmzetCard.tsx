import React from 'react'

interface NetOmzetCardProps {
  generalNet: number
  incomeReguler: number
  paxReguler: number
  regulerBreakdown: Record<string, { qty: number; total: number }>
  incomePelajar: number
  paxPelajar: number
  pelajarBreakdown: Record<string, { qty: number; total: number }>
  incomePaketan: number
  paketanBreakdown: Record<string, { qty: number; total: number }>
  incomeEvent: number
  paxEvent: number
  eventBreakdown: Record<string, { qty: number; total: number }>
  incomeVoucher: number
  paxVoucher: number
  voucherBreakdown: Record<string, { qty: number; total: number }>
  generalExpense: number
  dailyTarget: number
  updateDailyTarget: (target: number) => void
}

export const NetOmzetCard: React.FC<NetOmzetCardProps> = ({
  generalNet,
  incomeReguler,
  paxReguler,
  regulerBreakdown,
  incomePelajar,
  paxPelajar,
  pelajarBreakdown,
  incomePaketan,
  paketanBreakdown,
  incomeEvent,
  paxEvent,
  eventBreakdown,
  incomeVoucher,
  paxVoucher,
  voucherBreakdown,
  generalExpense,
  dailyTarget,
  updateDailyTarget,
}) => {
  return (
    <div className='group relative flex flex-col justify-between col-span-2 row-span-2 bg-zinc-900 shadow-2xl shadow-zinc-900/20 p-8 rounded-4xl overflow-hidden text-white hover:scale-[1.01] transition-transform duration-500 cursor-default pattern-cultural'>
      <div className='top-0 right-0 absolute bg-white/10 group-hover:bg-emerald-500/20 blur-3xl -mt-16 -mr-16 rounded-full w-32 h-32 transition-all duration-700'></div>

      <div className='z-10 relative'>
        <div className='inline-flex items-center gap-2 bg-white/10 shadow-lg backdrop-blur-md mb-4 px-3 py-1 border border-white/10 rounded-full font-black text-xs tracking-wider'>
          <div className='bg-emerald-500 rounded-full w-2 h-2 animate-pulse'></div>
          LIVE UPDATE
        </div>
        <h2 className='drop-shadow-sm mb-1 font-bold text-zinc-300 dark:text-zinc-500 text-sm uppercase tracking-widest'>
          Net Omzet (Bersih)
        </h2>
        <div className='drop-shadow-md font-black text-4xl md:text-5xl tracking-tight'>
          <span className='text-emerald-500'>Rp</span>{' '}
          {generalNet.toLocaleString('id-ID')}
        </div>

        {/* Show Gross Income Breakdown explicitly */}
        <div className='flex flex-col gap-1 opacity-90 mt-4 text-[10px] sm:text-xs'>
          {incomeReguler > 0 && (
            <div className='flex flex-col justify-between pb-1 border-white/20 border-b'>
              <div className='flex justify-between'>
                <span className='text-zinc-300'>Reguler:</span>
                <span className='font-bold'>
                  Rp {incomeReguler.toLocaleString('id-ID')} ({paxReguler})
                </span>
              </div>
              {Object.keys(regulerBreakdown)
                .sort((a, b) => b.localeCompare(a))
                .map((lbl, i) => (
                  <div
                    key={i}
                    className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                  >
                    <span className='mr-2 max-w-[120px] truncate'>
                      - {lbl}
                    </span>
                    <span>
                      Rp{' '}
                      {regulerBreakdown[lbl].total.toLocaleString('id-ID')}{' '}
                      ({regulerBreakdown[lbl].qty})
                    </span>
                  </div>
                ))}
            </div>
          )}

          {incomePelajar > 0 && (
            <div className='flex flex-col justify-between pb-1 border-white/20 border-b'>
              <div className='flex justify-between'>
                <span className='text-zinc-300'>Pelajar:</span>
                <span className='font-bold'>
                  Rp {incomePelajar.toLocaleString('id-ID')} ({paxPelajar})
                </span>
              </div>
              {Object.keys(pelajarBreakdown)
                .sort((a, b) => b.localeCompare(a))
                .map((lbl, i) => (
                  <div
                    key={i}
                    className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                  >
                    <span className='mr-2 max-w-[120px] truncate'>
                      - {lbl}
                    </span>
                    <span>
                      Rp{' '}
                      {pelajarBreakdown[lbl].total.toLocaleString('id-ID')}{' '}
                      ({pelajarBreakdown[lbl].qty})
                    </span>
                  </div>
                ))}
            </div>
          )}

          {incomePaketan > 0 && (
            <div className='flex flex-col justify-between pb-1 border-white/20 border-b'>
              <div className='flex justify-between'>
                <span className='text-zinc-300'>Outing:</span>
                <span className='font-bold'>
                  Rp {incomePaketan.toLocaleString('id-ID')} (
                  {Object.values(paketanBreakdown).reduce(
                    (a, b) => a + b.qty,
                    0,
                  )}
                  )
                </span>
              </div>
              {Object.keys(paketanBreakdown)
                .sort()
                .map((custName, i) => (
                  <div
                    key={i}
                    className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                  >
                    <span className='mr-2 max-w-[120px] truncate'>
                      - {custName}
                    </span>
                    <span>
                      Rp{' '}
                      {paketanBreakdown[custName].total.toLocaleString(
                        'id-ID',
                      )}{' '}
                      ({paketanBreakdown[custName].qty})
                    </span>
                  </div>
                ))}
            </div>
          )}

          {incomeEvent > 0 && (
            <div className='flex flex-col justify-between pb-1 border-white/20 border-b'>
              <div className='flex justify-between'>
                <span className='text-zinc-300'>Event / Lainnya:</span>
                <span className='font-bold'>
                  Rp {incomeEvent.toLocaleString('id-ID')} ({paxEvent})
                </span>
              </div>
              {Object.keys(eventBreakdown)
                .sort()
                .map((evtName, i) => (
                  <div
                    key={i}
                    className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                  >
                    <span className='mr-2 max-w-[120px] truncate'>
                      - {evtName}
                    </span>
                    <span>
                      Rp{' '}
                      {eventBreakdown[evtName].total.toLocaleString(
                        'id-ID',
                      )}{' '}
                      ({eventBreakdown[evtName].qty})
                    </span>
                  </div>
                ))}
            </div>
          )}

          {incomeVoucher > 0 && (
            <div className='flex flex-col justify-between pb-1 border-white/20 border-b'>
              <div className='flex justify-between'>
                <span className='text-zinc-300'>Voucher:</span>
                <span className='font-bold'>
                  Rp {incomeVoucher.toLocaleString('id-ID')} ({paxVoucher})
                </span>
              </div>
              {Object.keys(voucherBreakdown)
                .sort()
                .map((vchName, i) => (
                  <div
                    key={i}
                    className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                  >
                    <span className='mr-2 max-w-[120px] truncate'>
                      - {vchName}
                    </span>
                    <span>
                      Rp{' '}
                      {voucherBreakdown[vchName].total.toLocaleString(
                        'id-ID',
                      )}{' '}
                      ({voucherBreakdown[vchName].qty})
                    </span>
                  </div>
                ))}
            </div>
          )}

          {generalExpense > 0 && (
            <div className='flex justify-between pt-1'>
              <span className='text-red-300'>Keluar:</span>
              <span className='font-bold text-red-300'>
                - Rp {generalExpense.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className='z-10 relative mt-8'>
        <div className='flex justify-between items-center mb-2'>
          <div className='opacity-80 font-bold text-sm'>
            Progress Harian
          </div>
          <div className='font-bold text-xs'>
            {Math.min(100, Math.round((generalNet / dailyTarget) * 100))}%
          </div>
        </div>
        <div
          className='bg-black/20 dark:bg-black/10 shadow-inner rounded-full w-full h-3 overflow-hidden cursor-pointer'
          onClick={() => {
            const newTarget = prompt(
              'Set Target Harian (Rp):',
              dailyTarget.toString(),
            )
            if (newTarget) {
              const val = parseInt(newTarget)
              if (!isNaN(val)) {
                updateDailyTarget(val)
              }
            }
          }}
          title='Klik untuk ubah target'
        >
          <div
            className='bg-linear-to-r from-emerald-500 to-teal-400 shadow-lg rounded-full h-full transition-all duration-1000 ease-out'
            style={{
              width: `${Math.min(100, (generalNet / dailyTarget) * 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}
