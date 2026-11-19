import React from 'react'
import type { BreakdownData } from '../../utils/whatsappFormatter'

interface StatsGridProps {
  txCount: number
  generalExpense: number
  qrisTotal: number
  qrisCount: number
  qrisBreakdown: BreakdownData
  cashTotal: number
  cashCount: number
  cashBreakdown: BreakdownData
  websiteTotal: number
  websiteCount: number
  websiteBreakdown: BreakdownData
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  txCount,
  generalExpense,
  qrisTotal,
  qrisCount,
  qrisBreakdown,
  cashTotal,
  cashCount,
  cashBreakdown,
  websiteTotal,
  websiteCount,
  websiteBreakdown,
}) => {
  return (
    <>
      {/* Transaction Count */}
      <div className='group flex flex-col justify-center items-center hover:bg-white dark:hover:bg-zinc-900 hover:shadow-2xl p-6 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-4xl text-center hover:scale-105 transition-all duration-300 cursor-default glass-card'>
        <div className='flex justify-center items-center bg-amber-100 dark:bg-amber-900/30 shadow-sm mb-3 rounded-2xl w-12 h-12 text-amber-600 dark:text-amber-400 text-2xl group-hover:scale-110 transition-transform'>
          🧾
        </div>
        <div className='font-black text-zinc-900 dark:text-white text-3xl'>
          {txCount}
        </div>
        <div className='font-black text-zinc-400 dark:group-hover:text-zinc-300 group-hover:text-zinc-600 text-xs uppercase tracking-wider transition-colors'>
          Transaksi
        </div>
      </div>

      {/* Pengeluaran Card */}
      <div className='group flex flex-col justify-center items-center hover:bg-white dark:hover:bg-zinc-900 hover:shadow-red-500/10 hover:shadow-xl p-6 border-2 border-transparent hover:border-red-200 dark:hover:border-red-900 rounded-4xl text-center hover:scale-105 transition-all duration-300 cursor-default glass-card'>
        <div className='flex justify-center items-center bg-red-100 dark:bg-red-900/30 shadow-sm mb-3 rounded-2xl w-12 h-12 text-red-600 dark:text-red-400 text-2xl group-hover:scale-110 transition-transform'>
          💸
        </div>
        <div className='font-black text-zinc-900 dark:text-white text-xl md:text-2xl'>
          Rp {generalExpense.toLocaleString('id-ID')}
        </div>
        <div className='font-black text-zinc-400 dark:group-hover:text-red-400 group-hover:text-red-600 text-xs uppercase tracking-wider transition-colors'>
          Total Keluar
        </div>
      </div>

      {/* QRIS Count */}
      <div className='group flex flex-col justify-center items-center hover:bg-white dark:hover:bg-zinc-900 hover:shadow-blue-500/10 hover:shadow-xl p-6 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-900 rounded-4xl text-center hover:scale-105 transition-all duration-300 cursor-default glass-card'>
        <div className='flex justify-center items-center bg-blue-100 dark:bg-blue-900/30 shadow-sm mb-3 rounded-2xl w-12 h-12 text-blue-600 dark:text-blue-400 text-2xl group-hover:scale-110 transition-transform'>
          📱
        </div>
        <div className='font-black text-zinc-900 dark:text-white text-2xl'>
          {qrisTotal.toLocaleString('id-ID')}
        </div>
        <div className='font-black text-[10px] text-zinc-400 dark:group-hover:text-blue-400 group-hover:text-blue-600 uppercase tracking-wider transition-colors'>
          Total QRIS ({qrisCount})
        </div>
        {(qrisBreakdown.reg > 0 ||
          qrisBreakdown.plj > 0 ||
          qrisBreakdown.pkt > 0 ||
          qrisBreakdown.evt > 0 ||
          qrisBreakdown.vch > 0) && (
          <div className='mt-2 w-full text-[10px] text-zinc-500'>
            {qrisBreakdown.reg > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Reg:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {qrisBreakdown.reg.toLocaleString('id-ID')} (
                    {qrisBreakdown.regPax})
                  </span>
                </div>
                {Object.keys(qrisBreakdown.regulerDetails)
                  .sort((a, b) => b.localeCompare(a))
                  .map((lbl, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {lbl}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {qrisBreakdown.regulerDetails[
                          lbl
                        ].total.toLocaleString('id-ID')}{' '}
                        ({qrisBreakdown.regulerDetails[lbl].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {qrisBreakdown.plj > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Plj:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {qrisBreakdown.plj.toLocaleString('id-ID')} (
                    {qrisBreakdown.pljPax})
                  </span>
                </div>
                {Object.keys(qrisBreakdown.pelajarDetails)
                  .sort((a, b) => b.localeCompare(a))
                  .map((lbl, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {lbl}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {qrisBreakdown.pelajarDetails[
                          lbl
                        ].total.toLocaleString('id-ID')}{' '}
                        ({qrisBreakdown.pelajarDetails[lbl].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {qrisBreakdown.pkt > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Out:</span>
                </div>
                {Object.keys(qrisBreakdown.outingDetails)
                  .sort()
                  .map((custName, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {custName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {qrisBreakdown.outingDetails[
                          custName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({qrisBreakdown.outingDetails[custName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {qrisBreakdown.evt > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Evt:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {qrisBreakdown.evt.toLocaleString('id-ID')} (
                    {qrisBreakdown.evtPax})
                  </span>
                </div>
                {Object.keys(qrisBreakdown.eventDetails)
                  .sort()
                  .map((evtName, i) => (
                    <div
                      key={i}
                      className='flex justify-between pl-2 text-[9px] text-zinc-400'
                    >
                      <span className='mr-1 max-w-[80px] truncate'>
                        - {evtName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {qrisBreakdown.eventDetails[
                          evtName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({qrisBreakdown.eventDetails[evtName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {qrisBreakdown.vch > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Vch:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {qrisBreakdown.vch.toLocaleString('id-ID')} (
                    {qrisBreakdown.vchPax})
                  </span>
                </div>
                {Object.keys(qrisBreakdown.voucherDetails)
                  .sort()
                  .map((vchName, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {vchName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {qrisBreakdown.voucherDetails[
                          vchName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({qrisBreakdown.voucherDetails[vchName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cash Count */}
      <div className='group flex flex-col justify-center items-center hover:bg-white dark:hover:bg-zinc-900 hover:shadow-emerald-500/10 hover:shadow-xl p-6 border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-900 rounded-4xl text-center hover:scale-105 transition-all duration-300 cursor-default glass-card'>
        <div className='flex justify-center items-center bg-emerald-100 dark:bg-emerald-900/30 shadow-sm mb-3 rounded-2xl w-12 h-12 text-emerald-600 dark:text-emerald-400 text-2xl group-hover:scale-110 transition-transform'>
          💵
        </div>
        <div className='font-black text-zinc-900 dark:text-white text-2xl'>
          {cashTotal.toLocaleString('id-ID')}
        </div>
        <div className='font-black text-[10px] text-zinc-400 dark:group-hover:text-emerald-400 group-hover:text-emerald-600 uppercase tracking-wider transition-colors'>
          Total Cash ({cashCount})
        </div>
        {(cashBreakdown.reg > 0 ||
          cashBreakdown.plj > 0 ||
          cashBreakdown.pkt > 0 ||
          cashBreakdown.evt > 0 ||
          cashBreakdown.vch > 0) && (
          <div className='mt-2 w-full text-[10px] text-zinc-500'>
            {cashBreakdown.reg > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Reg:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {cashBreakdown.reg.toLocaleString('id-ID')} (
                    {cashBreakdown.regPax})
                  </span>
                </div>
                {Object.keys(cashBreakdown.regulerDetails)
                  .sort((a, b) => b.localeCompare(a))
                  .map((lbl, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {lbl}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {cashBreakdown.regulerDetails[
                          lbl
                        ].total.toLocaleString('id-ID')}{' '}
                        ({cashBreakdown.regulerDetails[lbl].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {cashBreakdown.plj > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Plj:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {cashBreakdown.plj.toLocaleString('id-ID')} (
                    {cashBreakdown.pljPax})
                  </span>
                </div>
                {Object.keys(cashBreakdown.pelajarDetails)
                  .sort((a, b) => b.localeCompare(a))
                  .map((lbl, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {lbl}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {cashBreakdown.pelajarDetails[
                          lbl
                        ].total.toLocaleString('id-ID')}{' '}
                        ({cashBreakdown.pelajarDetails[lbl].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {cashBreakdown.pkt > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Out:</span>
                </div>
                {Object.keys(cashBreakdown.outingDetails)
                  .sort()
                  .map((custName, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {custName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {cashBreakdown.outingDetails[
                          custName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({cashBreakdown.outingDetails[custName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {cashBreakdown.evt > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Evt:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {cashBreakdown.evt.toLocaleString('id-ID')} (
                    {cashBreakdown.evtPax})
                  </span>
                </div>
                {Object.keys(cashBreakdown.eventDetails)
                  .sort()
                  .map((evtName, i) => (
                    <div
                      key={i}
                      className='flex justify-between pl-2 text-[9px] text-zinc-400'
                    >
                      <span className='mr-1 max-w-[80px] truncate'>
                        - {evtName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {cashBreakdown.eventDetails[
                          evtName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({cashBreakdown.eventDetails[evtName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {cashBreakdown.vch > 0 && (
              <div className='flex flex-col'>
                <div className='flex justify-between'>
                  <span>Vch:</span>
                  <span className='whitespace-nowrap shrink-0'>
                    {cashBreakdown.vch.toLocaleString('id-ID')} (
                    {cashBreakdown.vchPax})
                  </span>
                </div>
                {Object.keys(cashBreakdown.voucherDetails)
                  .sort()
                  .map((vchName, i) => (
                    <div
                      key={i}
                      className='flex justify-between mt-0.5 pl-2 text-[9px] text-zinc-400 sm:text-[10px]'
                    >
                      <span className='mr-2 max-w-[100px] truncate'>
                        - {vchName}
                      </span>
                      <span className='whitespace-nowrap shrink-0'>
                        {cashBreakdown.voucherDetails[
                          vchName
                        ].total.toLocaleString('id-ID')}{' '}
                        ({cashBreakdown.voucherDetails[vchName].qty})
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Website Count */}
      {websiteCount > 0 && (
        <div className='group flex flex-col justify-center items-center hover:bg-white dark:hover:bg-zinc-900 hover:shadow-indigo-500/10 hover:shadow-xl p-6 border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 rounded-4xl text-center hover:scale-105 transition-all duration-300 cursor-default glass-card'>
          <div className='flex justify-center items-center bg-indigo-100 dark:bg-indigo-900/30 shadow-sm mb-3 rounded-2xl w-12 h-12 text-indigo-600 dark:text-indigo-400 text-2xl group-hover:scale-110 transition-transform'>
            🌐
          </div>
          <div className='font-black text-zinc-900 dark:text-white text-2xl'>
            {websiteTotal.toLocaleString('id-ID')}
          </div>
          <div className='font-black text-[10px] text-zinc-400 dark:group-hover:text-indigo-400 group-hover:text-indigo-600 uppercase tracking-wider transition-colors'>
            Total Website ({websiteCount})
          </div>
          {(websiteBreakdown.reg > 0 ||
            websiteBreakdown.plj > 0 ||
            websiteBreakdown.pkt > 0 ||
            websiteBreakdown.evt > 0 ||
            websiteBreakdown.vch > 0) && (
            <div className='mt-2 w-full text-[10px] text-zinc-500'>
              {websiteBreakdown.reg > 0 && (
                <div className='flex justify-between'>
                  <span>Reg:</span>
                  <span>
                    {websiteBreakdown.reg.toLocaleString('id-ID')} (
                    {websiteBreakdown.regPax})
                  </span>
                </div>
              )}
              {websiteBreakdown.plj > 0 && (
                <div className='flex justify-between'>
                  <span>Plj:</span>
                  <span>
                    {websiteBreakdown.plj.toLocaleString('id-ID')} (
                    {websiteBreakdown.pljPax})
                  </span>
                </div>
              )}
              {websiteBreakdown.pkt > 0 && (
                <div className='flex justify-between'>
                  <span>Pkt:</span>
                  <span>
                    {websiteBreakdown.pkt.toLocaleString('id-ID')} (
                    {websiteBreakdown.pktPax})
                  </span>
                </div>
              )}
              {websiteBreakdown.evt > 0 && (
                <div className='flex flex-col'>
                  <div className='flex justify-between'>
                    <span>Evt:</span>
                    <span>
                      {websiteBreakdown.evt.toLocaleString('id-ID')} (
                      {websiteBreakdown.evtPax})
                    </span>
                  </div>
                  {Object.keys(websiteBreakdown.eventDetails)
                    .sort()
                    .map((evtName, i) => (
                      <div
                        key={i}
                        className='flex justify-between pl-2 text-[9px] text-zinc-400'
                      >
                        <span className='mr-1 max-w-[80px] truncate'>
                          - {evtName}
                        </span>
                        <span>
                          {websiteBreakdown.eventDetails[
                            evtName
                          ].total.toLocaleString('id-ID')}{' '}
                          ({websiteBreakdown.eventDetails[evtName].qty})
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
