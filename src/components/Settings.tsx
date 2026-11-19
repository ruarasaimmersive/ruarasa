import React, { useState, useEffect } from 'react'
import { initDB, type ProductDoc } from '../db'
import ConfirmModal from './ConfirmModal'
import { PackageKanban } from './PackageKanban'
import { OutingManager } from './OutingManager'
import { DEFAULT_PACKAGE_GROUPS, DEFAULT_TICKET_PACKAGES } from '../constants'

const Settings = () => {
  const [products, setProducts] = useState<ProductDoc[]>([])
  const [viewMode, setViewMode] = useState<'main' | 'kanban' | 'outing'>('main')
  const [isEditing, setIsEditing] = useState<ProductDoc | null>(null)
  const [editForm, setEditForm] = useState<Partial<ProductDoc>>({})

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'info'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {},
  })

  const [resultModal, setResultModal] = useState({
    show: false,
    message: '',
    variant: 'success' as 'success' | 'error',
  })

  const closeConfirm = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }))

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const db = await initDB()
    const p = await db.products.find().exec()
    setProducts(p.map((doc: any) => doc.toJSON()))
  }

  const [lastId, setLastId] = useState('0')
  const [dailyTarget, setDailyTarget] = useState('3000000')
  const [autoSyncOn, setAutoSyncOn] = useState(true)
  const [autoSyncInterval, setAutoSyncInterval] = useState('10')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPrintingMode, setIsPrintingMode] = useState(false)
  const [packageGroups, setPackageGroups] = useState<any[]>([])
  const [ticketPackages, setTicketPackages] = useState<any[]>([])
  const [excludedPackages, setExcludedPackages] = useState<string[]>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [tempExcludedPackages, setTempExcludedPackages] = useState<string[]>([])
  const [customNominals, setCustomNominals] = useState<Record<string, number>>({})
  const [tempCustomNominals, setTempCustomNominals] = useState<Record<string, number>>({})

  useEffect(() => {
    const storedId = localStorage.getItem('last_order_id')
    if (storedId) setLastId(storedId)

    const storedTarget = localStorage.getItem('daily_target')
    if (storedTarget) setDailyTarget(storedTarget)

    const storedAutoSync = localStorage.getItem('auto_sync_enabled')
    if (storedAutoSync !== null) setAutoSyncOn(storedAutoSync === 'true')

    const storedInterval = localStorage.getItem('auto_sync_interval')
    if (storedInterval) setAutoSyncInterval(storedInterval)

    const storedPrintMode = localStorage.getItem('is_printing_mode')
    if (storedPrintMode !== null) setIsPrintingMode(storedPrintMode === 'true')

    const savedGroups = localStorage.getItem('package_groups')
    const g = savedGroups ? JSON.parse(savedGroups) : [...DEFAULT_PACKAGE_GROUPS]
    setPackageGroups(g)

    const savedPkgs = localStorage.getItem('ticket_packages')
    let p = savedPkgs ? JSON.parse(savedPkgs) : [...DEFAULT_TICKET_PACKAGES]
    let pUpdated = false

    const defaultRegIds = new Set(
      DEFAULT_TICKET_PACKAGES.filter((dp: any) => dp.groupId === 'g_reguler').map(
        (dp: any) => dp.id,
      ),
    )
    const initialLen = p.length
    p = p.filter((x: any) => x.groupId !== 'g_reguler' || defaultRegIds.has(x.id))
    if (p.length !== initialLen) pUpdated = true

    DEFAULT_TICKET_PACKAGES.forEach((dp: any) => {
      const idx = p.findIndex((x: any) => x.id === dp.id)
      if (idx === -1) {
        p.push(dp)
        pUpdated = true
      } else {
        const existing = p[idx]
        if (
          existing.name !== dp.name ||
          existing.nominal !== dp.nominal ||
          JSON.stringify(existing.features) !== JSON.stringify(dp.features)
        ) {
          p[idx] = {
            ...existing,
            name: dp.name,
            nominal: dp.nominal,
            displayNominal: dp.displayNominal,
            features: dp.features,
          }
          pUpdated = true
        }
      }
    })

    if (pUpdated) {
      localStorage.setItem('ticket_packages', JSON.stringify(p))
    }
    setTicketPackages(p)

    const storedExcluded = localStorage.getItem('omzet_excluded_packages')
    if (storedExcluded) setExcludedPackages(JSON.parse(storedExcluded))

    const storedCustom = localStorage.getItem('omzet_custom_nominals')
    if (storedCustom) setCustomNominals(JSON.parse(storedCustom))

    const intervalId = setInterval(() => {
      const isEnabled = localStorage.getItem('auto_sync_enabled') !== 'false'
      if (isEnabled) {
        const nextSyncStr = localStorage.getItem('next_sync_time')
        if (nextSyncStr) {
          const nextSync = parseInt(nextSyncStr, 10)
          const remaining = Math.max(
            0,
            Math.ceil((nextSync - Date.now()) / 1000),
          )
          setCountdown(remaining)
        } else {
          setCountdown(null)
        }
      } else {
        setCountdown(null)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const saveConfig = () => {
    localStorage.setItem('last_order_id', lastId)
    localStorage.setItem('daily_target', dailyTarget)
    localStorage.setItem('is_printing_mode', isPrintingMode.toString())
    localStorage.setItem('omzet_excluded_packages', JSON.stringify(excludedPackages))

    const finalAutoSyncOn = isPrintingMode ? false : autoSyncOn

    const isIntervalChanged =
      localStorage.getItem('auto_sync_interval') !== autoSyncInterval
    const isToggleChanged =
      localStorage.getItem('auto_sync_enabled') !== finalAutoSyncOn.toString()

    localStorage.setItem('auto_sync_enabled', finalAutoSyncOn.toString())
    localStorage.setItem('auto_sync_interval', autoSyncInterval)

    if (isIntervalChanged || isToggleChanged) {
      localStorage.removeItem('next_sync_time')
    }

    setResultModal({
      show: true,
      message: 'Konfigurasi berhasil disimpan ✅',
      variant: 'success',
    })
  }

  const saveFilter = () => {
    setExcludedPackages(tempExcludedPackages)
    setCustomNominals(tempCustomNominals)
    localStorage.setItem('omzet_excluded_packages', JSON.stringify(tempExcludedPackages))
    localStorage.setItem('omzet_custom_nominals', JSON.stringify(tempCustomNominals))
    setIsFilterModalOpen(false)
    setResultModal({
      show: true,
      message: 'Filter omzet berhasil disimpan ✅',
      variant: 'success',
    })
  }

  const handleEdit = (product: ProductDoc) => {
    setIsEditing(product)
    setEditForm(product)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing || !editForm.price) return

    try {
      const db = await initDB()
      const doc = await db.products.findOne(isEditing.id).exec()
      if (doc) {
        await doc.patch({
          price: Number(editForm.price),
          name: editForm.name,
        })
      }
      setIsEditing(null)
      loadProducts()
      setResultModal({
        show: true,
        message: 'Produk berhasil diperbarui ✅',
        variant: 'success',
      })
    } catch (error) {
      console.error(error)
      setResultModal({
        show: true,
        message: 'Gagal menyimpan ❌',
        variant: 'error',
      })
    }
  }

  if (viewMode === 'kanban') {
    return <PackageKanban onBack={() => setViewMode('main')} />
  }

  if (viewMode === 'outing') {
    return <OutingManager onBack={() => setViewMode('main')} />
  }

  return (
    <div className='slide-in-from-bottom-4 space-y-6 mx-auto px-4 md:px-0 max-w-2xl animate-in duration-500 fade-in'>
      <div className='flex flex-wrap justify-between items-end gap-4 mb-8'>
        <div>
          <h1 className='font-extrabold text-zinc-900 dark:text-white text-3xl tracking-tight'>
            Pengaturan
          </h1>
          <p className='text-zinc-500'>Kelola konfigurasi sistem dan paket</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setViewMode('outing')}
            className='flex items-center gap-2 bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-xl font-bold text-white text-sm transition-all cursor-pointer'
          >
            🚌 Jadwal Outing
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-white text-sm transition-all cursor-pointer'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' />
            </svg>
            Atur Harga & Paket
          </button>
        </div>
      </div>

      {/* System Config */}
      <div className='bg-white dark:bg-zinc-900 shadow-xl mb-6 p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl glass-card'>
        <h3 className='mb-4 font-bold text-zinc-900 dark:text-white text-lg'>
          Konfigurasi Sistem
        </h3>
        <div className='flex flex-col gap-6'>
          <div className='flex md:flex-row flex-col items-start gap-4'>
            <div className='flex-1 w-full'>
              <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                Target Harian (Rp)
              </label>
              <input
                type='number'
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder='3000000'
                className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full h-12 font-bold text-zinc-900 dark:text-white'
              />
              <p className='mt-1 text-zinc-400 text-xs'>
                Target omzet untuk progress bar.
              </p>
            </div>

            <div className='flex-1 w-full'>
              <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                Printer / Cetak
              </label>
              <div className='flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl h-12'>
                <input
                  type='checkbox'
                  checked={isPrintingMode}
                  onChange={(e) => setIsPrintingMode(e.target.checked)}
                  className='w-5 h-5 accent-zinc-900 cursor-pointer'
                />
                <span className='font-bold text-zinc-900 dark:text-white text-sm'>
                  Mode Antrean Cetak
                </span>
              </div>
              <p className='mt-1 text-zinc-400 text-xs'>
                Kumpulkan transaksi untuk dicetak sekaligus.
              </p>
            </div>
          </div>

          <div className='border-zinc-100 dark:border-zinc-800 border-t' />

          <div className='flex md:flex-row flex-col items-start md:items-start gap-4'>
            <div className='flex-1 w-full'>
              <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                Auto Sync Spreadsheet
              </label>
              <div className={`flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl h-12 ${isPrintingMode ? 'opacity-50' : ''}`}>
                <input
                  type='checkbox'
                  checked={isPrintingMode ? false : autoSyncOn}
                  onChange={(e) => setAutoSyncOn(e.target.checked)}
                  disabled={isPrintingMode}
                  className={`w-5 h-5 accent-zinc-900 ${isPrintingMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <span className='font-bold text-zinc-900 dark:text-white text-sm'>
                  {isPrintingMode ? 'Nonaktif (Mode Cetak Aktif)' : 'Aktif'}
                </span>
              </div>
              <p className='mt-1 text-zinc-400 text-xs'>
                {isPrintingMode ? 'Dinonaktifkan karena Mode Antrean Cetak aktif.' : 'Kirim data otomatis di latar belakang.'}
              </p>
            </div>

            <div className='flex-1 w-full'>
              <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                Jeda Sync (Menit)
              </label>
              <input
                type='number'
                value={autoSyncInterval}
                onChange={(e) => setAutoSyncInterval(e.target.value)}
                placeholder='10'
                disabled={!autoSyncOn || isPrintingMode}
                className='bg-zinc-50 dark:bg-zinc-800 disabled:opacity-50 p-3 rounded-xl w-full h-12 font-bold text-zinc-900 dark:text-white'
              />
              <p className='mt-1 text-zinc-400 text-xs'>
                {isPrintingMode
                  ? 'Sinkronisasi berjalan otomatis sesaat setelah cetak struk.'
                  : autoSyncOn && countdown !== null
                    ? `Sync waktu berikutnya: ${Math.floor(countdown / 60)}m ${countdown % 60}s`
                    : 'Jeda waktu sebelum sync otomatis.'}
              </p>
            </div>
          </div>
          <div className='border-zinc-100 dark:border-zinc-800 border-t' />

          <div className='flex md:flex-row flex-col items-start md:items-center justify-between gap-4'>
            <div className='flex-1'>
              <label className='block mb-1 font-bold text-zinc-500 text-xs uppercase'>
                Filter Omzet Dashboard
              </label>
              <p className='text-zinc-400 text-xs'>
                Atur paket tiket mana saja yang dihitung ke dalam laporan omzet kasir.
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                setTempExcludedPackages(excludedPackages)
                setTempCustomNominals(customNominals)
                setIsFilterModalOpen(true)
              }}
              className='flex justify-center items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-5 py-3 rounded-xl w-full md:w-auto font-bold text-zinc-900 dark:text-white text-sm transition-all cursor-pointer'
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M22 3H2l8 9.46V19l4 2v-8.54L22 3z' />
              </svg>
              Atur Filter Omzet
            </button>
          </div>

          <div className='flex justify-end pt-2'>
            <button
              onClick={saveConfig}
              className='bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 px-8 py-3 rounded-xl w-full md:w-auto h-12 font-bold text-white dark:text-zinc-900 transition-colors cursor-pointer'
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      <div className='gap-4 grid'>
        {products.map((p) => {
          if (
            p.name.includes('Immersive') ||
            p.name.includes('Sekar Geni') ||
            p.name.includes('Tiket')
          )
            return null
          return (
            <div
              key={p.id}
              className='flex justify-between items-center bg-white dark:bg-zinc-900 shadow-xl p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl glass-card'
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${p.name.includes('Kid') ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}
                >
                  {p.emoji}
                </div>
                <div>
                  <h3 className='font-bold text-zinc-900 dark:text-white text-lg'>
                    {p.name}
                  </h3>
                  <p className='font-bold text-zinc-500'>
                    Rp {p.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(p)}
                className='bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 px-6 py-3 rounded-xl font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer'
              >
                Edit
              </button>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(null)}
          className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-3xl w-full max-w-md animate-in zoom-in-95'
          >
            <h2 className='mb-6 font-bold text-zinc-900 dark:text-white text-2xl'>
              Edit Produk
            </h2>
            <form onSubmit={handleSave} className='space-y-4'>
              <div>
                <label className='block mb-1 font-bold text-zinc-500 text-xs uppercase'>
                  Nama Produk
                </label>
                <input
                  type='text'
                  value={editForm.name || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-zinc-900 dark:text-white'
                  disabled
                />
              </div>
              <div>
                <label className='block mb-1 font-bold text-zinc-500 text-xs uppercase'>
                  Harga (Rp)
                </label>
                <input
                  type='number'
                  value={editForm.price || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: Number(e.target.value) })
                  }
                  className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-zinc-900 dark:text-white'
                />
              </div>
              <div className='flex gap-3 mt-6'>
                <button
                  type='button'
                  onClick={() => setIsEditing(null)}
                  className='flex-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 px-4 py-3 rounded-xl font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer'
                >
                  Batal
                </button>
                <button
                  type='submit'
                  className='flex-1 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg px-4 py-3 rounded-xl font-bold text-white transition-colors cursor-pointer'
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal.show && (
        <div
          onClick={() => setResultModal((prev) => ({ ...prev, show: false }))}
          className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 rounded-3xl w-full max-w-sm text-center animate-in zoom-in-95'
          >
            <div
              className={`flex justify-center items-center mx-auto mb-4 rounded-full w-16 h-16 text-3xl ${
                resultModal.variant === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              }`}
            >
              {resultModal.variant === 'success' ? '✅' : '❌'}
            </div>
            <h3 className='mb-2 font-bold text-zinc-900 dark:text-white text-xl'>
              {resultModal.variant === 'success' ? 'Berhasil' : 'Gagal'}
            </h3>
            <p className='mb-6 font-medium text-zinc-500 text-sm'>
              {resultModal.message}
            </p>
            <button
              onClick={() =>
                setResultModal((prev) => ({ ...prev, show: false }))
              }
              className='bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 px-6 py-3 rounded-xl w-full font-bold text-white dark:text-zinc-900 transition-colors cursor-pointer'
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modal Filter Omzet Dashboard */}
      {isFilterModalOpen && (
        <div className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200'>
          <div className='bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200'>
            <div className='p-6 border-zinc-100 dark:border-zinc-800 border-b flex justify-between items-center'>
              <div>
                <h3 className='font-extrabold text-zinc-900 dark:text-white text-lg'>
                  Filter Omzet Dashboard
                </h3>
                <p className='text-zinc-500 text-xs mt-1'>
                  Pilih paket tiket mana saja yang ingin dihitung ke dalam omzet kasir.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsFilterModalOpen(false)}
                className='text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all'
              >
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>

            <div className='p-6 overflow-y-auto flex-1 flex flex-col gap-5 max-h-[55vh]'>
              {packageGroups.map((group) => {
                const groupPkgs = ticketPackages.filter((p) => p.groupId === group.id)
                if (groupPkgs.length === 0) return null

                return (
                  <div key={group.id} className='bg-zinc-50 dark:bg-zinc-800/10 p-5 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl'>
                    <h4 className='mb-4 font-black text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                      {group.name}
                    </h4>
                    <div className='flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/40'>
                      {groupPkgs.map((p) => {
                        const isIncluded = !tempExcludedPackages.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            className='flex items-center justify-between py-3.5 first:pt-0 last:pb-0 transition-colors'
                          >
                            <label className='flex items-center gap-3 cursor-pointer flex-1 group'>
                              <input
                                type='checkbox'
                                checked={isIncluded}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTempExcludedPackages(
                                      tempExcludedPackages.filter((id) => id !== p.id)
                                    )
                                  } else {
                                    setTempExcludedPackages([...tempExcludedPackages, p.id])
                                  }
                                }}
                                className='w-5 h-5 accent-emerald-500 cursor-pointer rounded-lg border-zinc-300 dark:border-zinc-700'
                              />
                              <div className='flex flex-col'>
                                <span className='font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-emerald-500 transition-colors leading-tight'>
                                  {p.name}
                                </span>
                                <span className='text-zinc-400 dark:text-zinc-500 text-xs mt-0.5'>
                                  Harga Asli: Rp {p.nominal.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </label>

                            {isIncluded && (
                              <div className='flex items-center gap-2 ml-4 animate-in slide-in-from-right-3 duration-200'>
                                <span className='text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider'>
                                  Omzet:
                                </span>
                                <div className='relative flex items-center'>
                                  <span className='absolute left-3 text-xs font-extrabold text-zinc-400 dark:text-zinc-500'>Rp</span>
                                  <input
                                    type='number'
                                    value={tempCustomNominals[p.id] !== undefined ? tempCustomNominals[p.id] : ''}
                                    placeholder={p.nominal.toString()}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (val === '') {
                                        const copy = { ...tempCustomNominals }
                                        delete copy[p.id]
                                        setTempCustomNominals(copy)
                                      } else {
                                        setTempCustomNominals({
                                          ...tempCustomNominals,
                                          [p.id]: parseInt(val, 10),
                                        })
                                      }
                                    }}
                                    className='bg-zinc-100 dark:bg-zinc-800/80 focus:bg-white dark:focus:bg-zinc-700 pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl w-30 h-9 text-sm font-black text-zinc-900 dark:text-white transition-all outline-none shadow-sm'
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className='p-6 border-zinc-100 dark:border-zinc-800 border-t flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-3xl'>
              <button
                type='button'
                onClick={() => setIsFilterModalOpen(false)}
                className='px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-sm transition-all cursor-pointer'
              >
                Batal
              </button>
              <button
                type='button'
                onClick={saveFilter}
                className='px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm transition-all cursor-pointer'
              >
                Simpan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
        isLoading={false}
      />
    </div>
  )
}

export default Settings