import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface OutingSchedule {
  id: string
  visit_date: string
  visit_time: string
  school_name: string
  students: number
  status: 'Terbooking' | 'Selesai'
}

export const OutingManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [schedules, setSchedules] = useState<OutingSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const now = new Date()
  const todayWITA = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Makassar',
  })
  const threeDaysLaterWITA = new Date(
    now.getTime() + 2 * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Makassar',
  })

  const [visitDate, setVisitDate] = useState(todayWITA)
  const [visitTime, setVisitTime] = useState('09:00 WITA')
  const [schoolName, setSchoolName] = useState('')
  const [students, setStudents] = useState('')
  const [status, setStatus] = useState<'Terbooking' | 'Selesai'>('Terbooking')

  const loadSchedules = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('outing_schedules')
      .select('*')
      .order('visit_date', { ascending: false })
      .order('visit_time', { ascending: true })

    if (!error && data) {
      setSchedules(data as OutingSchedule[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolName.trim() || !visitDate) return

    setSaving(true)
    const { error } = await supabase.from('outing_schedules').insert({
      visit_date: visitDate,
      visit_time: visitTime.trim() || '09:00 WITA',
      school_name: schoolName.trim(),
      students: Number(students) || 0,
      status,
    })
    setSaving(false)

    if (error) {
      alert('Gagal menyimpan jadwal: ' + error.message)
      return
    }

    setSchoolName('')
    setStudents('')
    loadSchedules()
  }

  const toggleStatus = async (item: OutingSchedule) => {
    const nextStatus = item.status === 'Terbooking' ? 'Selesai' : 'Terbooking'
    await supabase
      .from('outing_schedules')
      .update({ status: nextStatus })
      .eq('id', item.id)
    loadSchedules()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return
    await supabase.from('outing_schedules').delete().eq('id', id)
    loadSchedules()
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(`${dateStr}T00:00:00+08:00`).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Makassar',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className='slide-in-from-bottom-4 space-y-6 mx-auto px-4 md:px-0 max-w-4xl animate-in duration-300 fade-in'>
      <div className='flex flex-wrap justify-between items-center gap-4'>
        <div>
          <button
            onClick={onBack}
            className='flex items-center gap-1.5 mb-2 font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs cursor-pointer'
          >
            ← Kembali ke Pengaturan
          </button>
          <h1 className='font-extrabold text-zinc-900 dark:text-white text-2xl md:text-3xl tracking-tight'>
            Jadwal Outing (Internal)
          </h1>
          <p className='text-zinc-500 text-xs md:text-sm'>
            Halaman publik <span className='font-mono font-bold'>/outing</span> menampilkan jadwal 3 hari ke depan ({formatDate(todayWITA)} s.d. {formatDate(threeDaysLaterWITA)}).
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className='bg-white dark:bg-zinc-900 shadow-xl p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl space-y-4'
      >
        <h3 className='font-bold text-zinc-900 dark:text-white text-base'>
          + Tambah Jadwal Outing Sekolah / Instansi
        </h3>

        <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
          <div>
            <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
              Nama Sekolah / Instansi
            </label>
            <input
              type='text'
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder='Contoh: SDN 1 Mataram'
              className='bg-zinc-50 dark:bg-zinc-800 px-3.5 rounded-xl w-full h-11 font-bold text-zinc-900 dark:text-white text-sm'
            />
          </div>

          <div className='gap-3 grid grid-cols-2'>
            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Tanggal Kunjungan
              </label>
              <input
                type='date'
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className='bg-zinc-50 dark:bg-zinc-800 px-3 rounded-xl w-full h-11 font-bold text-zinc-900 dark:text-white text-sm'
              />
            </div>
            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Jam Kedatangan
              </label>
              <input
                type='text'
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                placeholder='09:00 WITA'
                className='bg-zinc-50 dark:bg-zinc-800 px-3 rounded-xl w-full h-11 font-bold text-zinc-900 dark:text-white text-sm'
              />
            </div>
          </div>

          <div className='gap-3 grid grid-cols-2'>
            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Jumlah Siswa / Pax
              </label>
              <input
                type='number'
                min='0'
                value={students}
                onChange={(e) => setStudents(e.target.value)}
                placeholder='30'
                className='bg-zinc-50 dark:bg-zinc-800 px-3.5 rounded-xl w-full h-11 font-bold text-zinc-900 dark:text-white text-sm'
              />
            </div>
            <div>
              <label className='block mb-1.5 font-bold text-zinc-500 text-xs uppercase'>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Terbooking' | 'Selesai')}
                className='bg-zinc-50 dark:bg-zinc-800 px-3 rounded-xl w-full h-11 font-bold text-zinc-900 dark:text-white text-sm'
              >
                <option value='Terbooking'>Terbooking</option>
                <option value='Selesai'>Selesai</option>
              </select>
            </div>
          </div>

          <div className='flex items-end'>
            <button
              type='submit'
              disabled={saving}
              className='bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl w-full h-11 font-bold text-white text-sm transition-all cursor-pointer'
            >
              {saving ? 'Menyimpan...' : 'Simpan Jadwal Outing'}
            </button>
          </div>
        </div>
      </form>

      <div className='bg-white dark:bg-zinc-900 shadow-xl p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='font-bold text-zinc-900 dark:text-white text-base'>
            Semua Jadwal Outing ({schedules.length})
          </h3>
        </div>

        {loading ? (
          <p className='py-8 text-zinc-400 text-sm text-center'>Memuat jadwal...</p>
        ) : schedules.length === 0 ? (
          <p className='py-8 text-zinc-400 text-sm text-center'>
            Belum ada jadwal outing tersimpan.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead>
                <tr className='border-zinc-100 dark:border-zinc-800 border-b font-bold text-zinc-400 text-xs uppercase'>
                  <th className='px-3 py-3'>Tanggal</th>
                  <th className='px-3 py-3'>Jam</th>
                  <th className='px-3 py-3'>Sekolah / Instansi</th>
                  <th className='px-3 py-3 text-center'>Siswa</th>
                  <th className='px-3 py-3 text-center'>Status</th>
                  <th className='px-3 py-3 text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {schedules.map((item) => {
                  const isPublicVisible =
                    item.visit_date >= todayWITA &&
                    item.visit_date <= threeDaysLaterWITA
                  return (
                    <tr
                      key={item.id}
                      className={isPublicVisible ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}
                    >
                      <td className='px-3 py-3.5 font-bold text-zinc-900 dark:text-white whitespace-nowrap'>
                        {formatDate(item.visit_date)}
                        {isPublicVisible && (
                          <span className='bg-emerald-500 ml-2 px-2 py-0.5 rounded-full font-black text-[10px] text-white uppercase'>
                            Publik (3 Hari)
                          </span>
                        )}
                      </td>
                      <td className='px-3 py-3.5 text-zinc-600 dark:text-zinc-300 text-xs whitespace-nowrap'>
                        {item.visit_time}
                      </td>
                      <td className='px-3 py-3.5 font-bold text-zinc-900 dark:text-white'>
                        {item.school_name}
                      </td>
                      <td className='px-3 py-3.5 font-bold text-sky-600 text-center'>
                        {item.students}
                      </td>
                      <td className='px-3 py-3.5 text-center'>
                        <button
                          type='button'
                          onClick={() => toggleStatus(item)}
                          title='Klik untuk ubah status'
                          className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase cursor-pointer ${
                            item.status === 'Terbooking'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className='px-3 py-3.5 text-right'>
                        <button
                          type='button'
                          onClick={() => handleDelete(item.id, item.school_name)}
                          className='bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold text-red-600 text-xs cursor-pointer'
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}