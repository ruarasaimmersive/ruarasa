import React, { useState, useEffect } from 'react'
import {
  DEFAULT_PACKAGE_GROUPS as DEFAULT_GROUPS,
  DEFAULT_TICKET_PACKAGES as DEFAULT_PACKAGES,
} from '../constants'
import {
  getTicketPackagesFromDB,
  upsertTicketPackage,
  deleteTicketPackageFromDB,
} from '../lib/supabase'

export type VariantType = 'REGULER' | 'PELAJAR' | 'EVENT' | 'OUTING' | 'VOUCHER'

export interface PricingRule {
  id: string
  minQty?: number | ''
  maxQty?: number | ''
  startTime?: string
  endTime?: string
  days?: number[]
  overrideNominal: number | ''
  overrideDisplayNominal: number | ''
  multipleOf?: number | ''
  multiplePrice?: number | ''
  multipleDisplayPrice?: number | ''
  endDate?: string
}

export interface TicketPackage {
  id: string
  groupId: string
  name: string
  variant: VariantType
  nominal: number | ''
  displayNominal: number | ''
  rules: PricingRule[]
  features?: string[]
  badge?: string
  popular?: boolean
}

export interface PackageGroup {
  id: string
  name: string
  defaultVariant?: VariantType
}

const PRESET_FEATURES = [
  'Immersive',
  'Kids Zone',
  'Photobooth',
  'Nirwana Waterpark',
  'Bamboo Land',
  'Event',
]

export const PackageKanban = ({ onBack }: { onBack: () => void }) => {
  const [groups, setGroups] = useState<PackageGroup[]>(() => {
    const saved = localStorage.getItem('package_groups')
    return saved ? JSON.parse(saved) : DEFAULT_GROUPS
  })
  const [packages, setPackages] = useState<TicketPackage[]>(() => {
    const saved = localStorage.getItem('ticket_packages')
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGES
  })

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PackageGroup | null>(null)

  const [showPkgModal, setShowPkgModal] = useState(false)
  const [editingPkg, setEditingPkg] = useState<TicketPackage | null>(null)

  useEffect(() => {
    let isMounted = true

    const syncFromSupabase = async () => {
      try {
        const dbRows = await getTicketPackagesFromDB()
        if (!isMounted || !dbRows || dbRows.length === 0) return

        setGroups((prev) => {
          const nextGroups = [...prev]
          let gChanged = false
          DEFAULT_GROUPS.forEach((dg) => {
            if (!nextGroups.find((g) => g.id === dg.id)) {
              nextGroups.push(dg)
              gChanged = true
            }
          })
          dbRows.forEach((row) => {
            if (!nextGroups.find((g) => g.id === row.group_id)) {
              nextGroups.push({
                id: row.group_id,
                name: row.group_name || row.group_id,
                defaultVariant: row.variant || 'REGULER',
              })
              gChanged = true
            }
          })
          return gChanged ? nextGroups : prev
        })

        const mapped: TicketPackage[] = dbRows.map((row: any) => ({
          id: row.id,
          groupId: row.group_id,
          name: row.name,
          variant: row.variant,
          nominal: Number(row.nominal),
          displayNominal: Number(row.display_nominal),
          rules: Array.isArray(row.rules) ? row.rules : [],
          features: Array.isArray(row.features) ? row.features : ['Immersive'],
          badge: row.badge || '',
          popular: Boolean(row.popular),
        }))

        setPackages(mapped)
        localStorage.setItem('ticket_packages', JSON.stringify(mapped))
      } catch (err) {
        console.warn('Gagal memuat paket dari Supabase, memakai cache lokal:', err)
      }
    }

    syncFromSupabase()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('package_groups', JSON.stringify(groups))
    localStorage.setItem('ticket_packages', JSON.stringify(packages))
  }, [groups, packages])

  const saveGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const defaultVariant =
      (formData.get('defaultVariant') as VariantType) || 'REGULER'

    if (editingGroup?.id) {
      setGroups((gs) =>
        gs.map((g) =>
          g.id === editingGroup.id ? { ...g, name, defaultVariant } : g,
        ),
      )
    } else {
      setGroups((gs) => [
        ...gs,
        { id: 'g_' + Date.now(), name, defaultVariant },
      ])
    }
    setShowGroupModal(false)
    setEditingGroup(null)
  }

  const deleteGroup = (id: string) => {
    if (!confirm('Hapus kategori ini beserta isi paketnya?')) return
    const removedIds = packages.filter((p) => p.groupId === id).map((p) => p.id)
    setGroups((gs) => gs.filter((g) => g.id !== id))
    setPackages((ps) => ps.filter((p) => p.groupId !== id))
    removedIds.forEach((pkgId) => {
      deleteTicketPackageFromDB(pkgId).catch(console.error)
    })
  }

  const savePackage = async (pkg: TicketPackage) => {
    const nextList = packages.find((p) => p.id === pkg.id)
      ? packages.map((p) => (p.id === pkg.id ? pkg : p))
      : [...packages, pkg]

    setPackages(nextList)
    localStorage.setItem('ticket_packages', JSON.stringify(nextList))
    setShowPkgModal(false)

    const grp = groups.find((g) => g.id === pkg.groupId)
    try {
      await upsertTicketPackage({
        id: pkg.id,
        group_id: pkg.groupId,
        group_name: grp?.name || 'Reguler',
        name: pkg.name,
        variant: pkg.variant,
        nominal: Number(pkg.nominal || 0),
        display_nominal: Number(
          pkg.displayNominal === '' ? pkg.nominal || 0 : pkg.displayNominal,
        ),
        rules: pkg.rules || [],
        features: pkg.features || ['Immersive'],
        badge: pkg.badge || '',
        popular: Boolean(pkg.popular),
      } as any)
    } catch (err) {
      console.error(err)
      alert('Tersimpan di browser, tetapi gagal sinkron ke Supabase. Cek koneksi internet.')
    }
  }

  const deletePackage = async (id: string) => {
    if (!confirm('Hapus paket ini?')) return
    const nextList = packages.filter((p) => p.id !== id)
    setPackages(nextList)
    localStorage.setItem('ticket_packages', JSON.stringify(nextList))

    try {
      await deleteTicketPackageFromDB(id)
    } catch (err) {
      console.error('Gagal menghapus paket di Supabase:', err)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={onBack}
          className='bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2 rounded-xl transition-colors'
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M19 12H5M12 19l-7-7 7-7' />
          </svg>
        </button>
        <div>
          <h2 className='font-extrabold text-zinc-900 dark:text-white text-3xl tracking-tight'>
            Atur Harga & Paket
          </h2>
          <p className='text-zinc-500'>
            Kelola dinamis kategori dan aturan harga tiket.
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          onClick={() => {
            setEditingGroup(null)
            setShowGroupModal(true)
          }}
          className='bg-zinc-900 dark:bg-white px-4 py-2 rounded-xl font-bold text-white dark:text-zinc-900 text-sm'
        >
          + Tambah Jenis Paket
        </button>
      </div>

      <div className='flex gap-6 pb-4 overflow-x-auto snap-x'>
        {groups.map((group) => (
          <div
            key={group.id}
            className='flex flex-col bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-3xl min-w-[320px] max-w-[320px] snap-start shrink-0'
          >
            <div className='flex justify-between items-center mb-4'>
              <h3 className='font-bold text-zinc-900 dark:text-white text-lg'>
                {group.name}
              </h3>
              <div className='flex gap-1'>
                <button
                  onClick={() => {
                    setEditingGroup(group)
                    setShowGroupModal(true)
                  }}
                  className='p-1 text-zinc-400 hover:text-emerald-500 transition-colors'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' />
                  </svg>
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className='p-1 text-zinc-400 hover:text-red-500 transition-colors'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                  </svg>
                </button>
              </div>
            </div>

            <div className='flex flex-col flex-1 gap-3'>
              {packages
                .filter((p) => p.groupId === group.id)
                .map((pkg) => (
                  <div
                    key={pkg.id}
                    className='bg-white dark:bg-zinc-800 shadow-sm p-4 border border-zinc-100 dark:border-zinc-700 rounded-2xl'
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <h4 className='font-bold text-zinc-900 dark:text-white'>
                        {pkg.name}
                      </h4>
                      <span className='bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full font-bold text-[10px] text-zinc-500'>
                        {pkg.variant}
                      </span>
                    </div>
                    <div className='flex justify-between text-zinc-500 text-sm'>
                      <span>Nominal:</span>
                      <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                        Rp {Number(pkg.nominal).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {(pkg.features?.length || 0) > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {pkg.features!.map((f) => (
                          <span
                            key={f}
                            className='bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md font-semibold text-[10px] text-emerald-700 dark:text-emerald-300'
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className='flex gap-2 mt-4'>
                      <button
                        onClick={() => {
                          setEditingPkg(pkg)
                          setShowPkgModal(true)
                        }}
                        className='flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 py-1.5 rounded-lg font-bold text-zinc-600 dark:text-zinc-300 text-xs transition-colors'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className='bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg font-bold text-red-500 text-xs transition-colors'
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => {
                setEditingPkg({
                  id: 'p_' + Date.now(),
                  groupId: group.id,
                  name: '',
                  variant: group.defaultVariant || 'REGULER',
                  nominal: '',
                  displayNominal: '',
                  rules: [],
                  features: ['Immersive'],
                  badge: '',
                  popular: false,
                })
                setShowPkgModal(true)
              }}
              className='mt-4 py-3 border-2 border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600 border-dashed rounded-2xl font-bold text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-400 dark:text-zinc-500 text-sm transition-colors'
            >
              + Tambah Paket
            </button>
          </div>
        ))}
      </div>

      {showGroupModal && (
        <div
          className='z-50 fixed inset-0 flex justify-center items-center bg-black/60 p-4'
          onClick={() => setShowGroupModal(false)}
        >
          <div
            className='bg-white dark:bg-zinc-900 mt-[100px] p-6 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='mb-4 font-bold text-zinc-900 dark:text-white text-lg'>
              {editingGroup?.id ? 'Edit Kategori' : 'Kategori Baru'}
            </h3>
            <form onSubmit={saveGroup} className='space-y-4'>
              <div>
                <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                  Nama Jenis Paket
                </label>
                <input
                  name='name'
                  defaultValue={editingGroup?.name || ''}
                  required
                  className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full font-bold text-zinc-900 dark:text-white'
                  placeholder='Cth: Reguler'
                />
              </div>
              <div>
                <label className='block mt-4 mb-2 font-bold text-zinc-500 text-xs uppercase'>
                  Tipe Variant Default
                </label>
                <select
                  name='defaultVariant'
                  defaultValue={editingGroup?.defaultVariant || 'REGULER'}
                  className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full font-bold text-zinc-900 dark:text-white appearance-none'
                >
                  <option value='REGULER'>REGULER</option>
                  <option value='PELAJAR'>PELAJAR</option>
                  <option value='EVENT'>EVENT</option>
                  <option value='OUTING'>OUTING</option>
                  <option value='VOUCHER'>VOUCHER</option>
                </select>
              </div>
              <div className='flex gap-2 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowGroupModal(false)}
                  className='flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-500 text-sm'
                >
                  Batal
                </button>
                <button
                  type='submit'
                  className='flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 py-3 rounded-xl font-bold text-white dark:text-zinc-900 text-sm'
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPkgModal && editingPkg && (
        <PackageEditorModal
          pkg={editingPkg}
          onSave={savePackage}
          onClose={() => setShowPkgModal(false)}
        />
      )}
    </div>
  )
}

function PackageEditorModal({
  pkg,
  onSave,
  onClose,
}: {
  pkg: TicketPackage
  onSave: (p: TicketPackage) => void
  onClose: () => void
}) {
  const [data, setData] = useState<TicketPackage>(pkg)
  const [newFeatureInput, setNewFeatureInput] = useState('')
  const [isDifferentDisplay, setIsDifferentDisplay] = useState(
    pkg.nominal !== '' &&
      pkg.displayNominal !== '' &&
      pkg.nominal !== pkg.displayNominal,
  )

  const allFeatureOptions = Array.from(
    new Set([...PRESET_FEATURES, ...(data.features || [])]),
  )

  const handleAddCustomFeature = () => {
    const trimmed = newFeatureInput.trim()
    if (!trimmed) return
    const current = data.features || []
    if (!current.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      setData({ ...data, features: [...current, trimmed] })
    }
    setNewFeatureInput('')
  }

  const handleAddRule = () => {
    setData((d) => ({
      ...d,
      rules: [
        ...d.rules,
        {
          id: 'r_' + Date.now(),
          overrideNominal: '',
          overrideDisplayNominal: '',
        },
      ],
    }))
  }

  const updateRule = (id: string, updates: Partial<PricingRule>) => {
    setData((d) => ({
      ...d,
      rules: d.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  }

  const removeRule = (id: string) => {
    setData((d) => ({ ...d, rules: d.rules.filter((r) => r.id !== id) }))
  }

  return (
    <div
      className='z-60 fixed inset-0 flex justify-center items-center bg-black/60 p-4 pt-16 overflow-y-auto'
      onClick={onClose}
    >
      <div
        className='relative flex flex-col bg-white dark:bg-zinc-900 my-auto p-6 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className='mb-6 font-bold text-zinc-900 dark:text-white text-xl'>
          {pkg.name ? 'Edit Paket' : 'Tambah Paket'}
        </h3>

        <div className='flex-1 space-y-5'>
          <div>
            <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
              Nama Paket
            </label>
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-zinc-900 dark:text-white'
              placeholder='Cth: Paket Immersive'
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Variant
              </label>
              <select
                value={data.variant}
                onChange={(e) =>
                  setData({ ...data, variant: e.target.value as VariantType })
                }
                className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-zinc-900 dark:text-white appearance-none'
              >
                <option value='REGULER'>REGULER</option>
                <option value='PELAJAR'>PELAJAR</option>
                <option value='EVENT'>EVENT</option>
                <option value='OUTING'>OUTING</option>
                <option value='VOUCHER'>VOUCHER</option>
              </select>
            </div>

            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Label Badge (Opsional)
              </label>
              <input
                value={data.badge || ''}
                onChange={(e) => setData({ ...data, badge: e.target.value })}
                className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-zinc-900 dark:text-white text-sm'
                placeholder='Cth: 🔥 Paket Complete'
              />
            </div>
          </div>

          <div>
            <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
              Fasilitas / Fitur Paket
            </label>
            <div className='space-y-3 bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-xl'>
              <div className='grid grid-cols-2 gap-2'>
                {allFeatureOptions.map((feat) => {
                  const isChecked = (data.features || []).includes(feat)
                  return (
                    <label
                      key={feat}
                      className='flex items-center gap-2 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={isChecked}
                        onChange={(e) => {
                          const currentFeats = data.features || []
                          const newFeats = e.target.checked
                            ? [...currentFeats, feat]
                            : currentFeats.filter((f) => f !== feat)
                          setData({ ...data, features: newFeats })
                        }}
                        className='border-zinc-300 rounded focus:ring-emerald-500 w-4 h-4 text-emerald-500 cursor-pointer'
                      />
                      <span className='font-bold text-zinc-700 dark:text-zinc-300 text-sm'>
                        {feat}
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className='flex gap-2 pt-2 border-zinc-200 dark:border-zinc-700 border-t'>
                <input
                  type='text'
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomFeature()
                    }
                  }}
                  placeholder='Tambah fasilitas baru... (cth: Sepeda Listrik)'
                  className='flex-1 bg-white dark:bg-zinc-900 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-900 dark:text-white text-xs'
                />
                <button
                  type='button'
                  onClick={handleAddCustomFeature}
                  className='bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 px-3 py-2 rounded-lg font-bold text-white dark:text-zinc-900 text-xs transition-colors'
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-5'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={Boolean(data.popular)}
                onChange={(e) =>
                  setData({ ...data, popular: e.target.checked })
                }
                className='border-zinc-300 rounded focus:ring-sky-500 w-5 h-5 text-sky-500'
              />
              <span className='font-bold text-zinc-700 dark:text-zinc-300 text-sm'>
                Sorot Paket Unggulan (Biru)
              </span>
            </label>

            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={isDifferentDisplay}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIsDifferentDisplay(checked)
                  if (!checked) {
                    setData((d) => ({ ...d, displayNominal: d.nominal }))
                    setData((d) => ({
                      ...d,
                      rules: d.rules.map((r) => ({
                        ...r,
                        overrideDisplayNominal: r.overrideNominal,
                      })),
                    }))
                  }
                }}
                className='border-zinc-300 rounded focus:ring-emerald-500 w-5 h-5 text-emerald-500'
              />
              <span className='font-bold text-zinc-700 dark:text-zinc-300 text-sm'>
                Harga Tampil Beda?
              </span>
            </label>
          </div>

          <div className='flex gap-4'>
            <div className='flex-1'>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Nominal {isDifferentDisplay ? '(Laporan)' : ''}
              </label>
              <input
                type='number'
                value={data.nominal}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : ''
                  setData((d) => ({
                    ...d,
                    nominal: val,
                    displayNominal: isDifferentDisplay
                      ? d.displayNominal
                      : val,
                  }))
                }}
                className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-emerald-600 dark:text-emerald-400'
                placeholder='35000'
              />
            </div>

            {isDifferentDisplay && (
              <div className='flex-1'>
                <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                  Nominal Tampil
                </label>
                <input
                  type='number'
                  value={data.displayNominal}
                  onChange={(e) =>
                    setData({
                      ...data,
                      displayNominal: e.target.value
                        ? Number(e.target.value)
                        : '',
                    })
                  }
                  className='bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl w-full font-bold text-emerald-600 dark:text-emerald-400'
                  placeholder='25000'
                />
              </div>
            )}
          </div>

          <div className='pt-4 border-zinc-100 dark:border-zinc-800 border-t'>
            <div className='flex justify-between items-center mb-4'>
              <h4 className='font-bold text-zinc-900 dark:text-white text-sm'>
                Aturan Harga Spesifik
              </h4>
              <button
                type='button'
                onClick={handleAddRule}
                className='bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors'
              >
                + Aturan Baru
              </button>
            </div>

            <div className='space-y-4'>
              {(data.rules || []).map((rule, idx) => (
                <div
                  key={rule.id}
                  className='group relative space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl'
                >
                  <button
                    type='button'
                    onClick={() => removeRule(rule.id)}
                    className='top-2 right-2 absolute p-1 text-zinc-400 hover:text-red-500'
                  >
                    ✕
                  </button>
                  <div className='mb-2 font-bold text-zinc-500 text-xs'>
                    Aturan #{idx + 1}
                  </div>
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <label className='font-bold text-[10px] text-zinc-500 uppercase'>
                        Min Qty
                      </label>
                      <input
                        type='number'
                        placeholder='-'
                        value={rule.minQty || ''}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            minQty: e.target.value
                              ? Number(e.target.value)
                              : '',
                          })
                        }
                        className='bg-white dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full font-bold text-sm'
                      />
                    </div>
                    <div className='flex-1'>
                      <label className='font-bold text-[10px] text-zinc-500 uppercase'>
                        Max Qty
                      </label>
                      <input
                        type='number'
                        placeholder='-'
                        value={rule.maxQty || ''}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            maxQty: e.target.value
                              ? Number(e.target.value)
                              : '',
                          })
                        }
                        className='bg-white dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full font-bold text-sm'
                      />
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <label className='font-bold text-[10px] text-zinc-500 uppercase'>
                        Ubah Nominal Menjadi
                      </label>
                      <input
                        type='number'
                        value={rule.overrideNominal}
                        onChange={(e) => {
                          const val = e.target.value
                            ? Number(e.target.value)
                            : ''
                          updateRule(rule.id, {
                            overrideNominal: val,
                            overrideDisplayNominal: isDifferentDisplay
                              ? rule.overrideDisplayNominal !== ''
                                ? rule.overrideDisplayNominal
                                : val
                              : val,
                          })
                        }}
                        className='bg-white dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full font-bold text-emerald-600 dark:text-emerald-400 text-sm'
                        placeholder='Cth: 30000'
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(data.rules?.length || 0) === 0 && (
                <div className='py-4 border border-zinc-200 dark:border-zinc-700 border-dashed rounded-xl text-zinc-500 text-sm text-center'>
                  Belum ada aturan khusus
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='flex gap-3 mt-8 pt-4 border-zinc-100 dark:border-zinc-800 border-t'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 transition-colors'
          >
            Batal
          </button>
          <button
            type='button'
            onClick={() => {
              const payload = { ...data }
              if (!isDifferentDisplay) {
                payload.displayNominal = payload.nominal
                payload.rules = (payload.rules || []).map((r) => ({
                  ...r,
                  overrideDisplayNominal: r.overrideNominal,
                  multipleDisplayPrice:
                    r.multiplePrice !== undefined ? r.multiplePrice : undefined,
                }))
              }
              onSave(payload)
            }}
            disabled={
              !data.name ||
              data.nominal === '' ||
              (isDifferentDisplay && data.displayNominal === '')
            }
            className='flex-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 shadow-emerald-500/20 shadow-lg py-3 rounded-xl font-bold text-white transition-colors'
          >
            Simpan Paket
          </button>
        </div>
      </div>
    </div>
  )
}