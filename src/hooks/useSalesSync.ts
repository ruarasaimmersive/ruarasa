import { useState, useEffect, useCallback } from 'react'
import { initDB, type SaleDoc } from '../db'
import { DEFAULT_TICKET_PACKAGES } from '../constants'
import { upsertSalesToDB, getSalesFromDB } from '../lib/supabase'

export const useSalesSync = () => {
  const [sales, setSales] = useState<SaleDoc[]>([])
  const [currentCashier, setCurrentCashier] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingItem, setEditingItem] = useState<SaleDoc | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'info'
    onConfirm: () => void
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {},
  })

  const [showToast, setShowToast] = useState({
    show: false,
    message: '',
    variant: 'success' as 'success' | 'error',
  })

  const closeConfirm = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }))

  const pullFromSupabase = useCallback(async (silent = true) => {
    if (!navigator.onLine) return 0
    if (!silent) setIsSyncing(true)

    try {
      const rows = await getSalesFromDB(300)
      if (!rows || rows.length === 0) {
        if (!silent) {
          setShowToast({
            show: true,
            message: 'Belum ada data transaksi di server Supabase.',
            variant: 'error',
          })
        }
        return 0
      }

      const db = await initDB()
      const localDocs = await db.sales.find().exec()
      const unsyncedIds = new Set(
        localDocs
          .map((d: any) => d.toJSON())
          .filter((s: any) => !s.is_synced)
          .map((s: any) => s.transaction_id),
      )

      const mappedDocs = rows
        .filter((r) => !unsyncedIds.has(r.transaction_id))
        .map((r) => ({
          transaction_id: String(r.transaction_id),
          order_id: Number(r.order_id) || 0,
          tanggal: new Date(r.tanggal).toISOString(),
          nama_barang: String(r.nama_barang || 'Item'),
          qty: Number(r.qty) || 1,
          harga_satuan: Number(r.harga_satuan) || 0,
          total_harga: Number(r.total_harga) || 0,
          display_total: Number(r.display_total ?? r.total_harga) || 0,
          metode_pembayaran: String(r.metode_pembayaran || 'CASH'),
          kasir: String(r.kasir || '-'),
          customer_name: String(r.customer_name || ''),
          nomor_hp: String(r.nomor_hp || '-'),
          source: String(r.source || 'UMUM'),
          type: String(r.type || 'IN'),
          is_synced: true,
          is_deleted: Boolean(r.is_deleted),
          notes: String(r.notes || ''),
          variant: String(r.variant || '-'),
          ...(r.booking_id ? { booking_id: Number(r.booking_id) } : {}),
        }))

      if (mappedDocs.length > 0) {
        await db.sales.bulkUpsert(mappedDocs)
        const maxOrderId = mappedDocs.reduce(
          (max, item) => Math.max(max, item.order_id),
          parseInt(localStorage.getItem('last_order_id') || '0', 10),
        )
        localStorage.setItem('last_order_id', String(maxOrderId))
      }

      if (!silent) {
        setShowToast({
          show: true,
          message: `Berhasil mengambil ${mappedDocs.length} data dari Supabase! ✅`,
          variant: 'success',
        })
      }

      return mappedDocs.length
    } catch (e: any) {
      console.error('[pullFromSupabase] Error:', e)
      if (!silent) {
        setShowToast({
          show: true,
          message: `Gagal ambil data: ${e.message} ❌`,
          variant: 'error',
        })
      }
      return 0
    } finally {
      if (!silent) setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    const name = localStorage.getItem('cashier_name') || ''
    setCurrentCashier(name)

    let sub: any
    let isMounted = true

    const load = async () => {
      const db = await initDB()
      if (!isMounted) return

      sub = db.sales
        .find({
          selector: {},
          sort: [{ tanggal: 'desc' }],
        })
        .$.subscribe((docs: any[]) => {
          setSales(docs.map((d) => d.toJSON()))
        })

      await pullFromSupabase(true)
    }

    load()
    return () => {
      isMounted = false
      if (sub) sub.unsubscribe()
    }
  }, [pullFromSupabase])

  const handleDeleteAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Cache Lokal?',
      message:
        'Riwayat transaksi di browser perangkat ini akan dihapus (data di Supabase tetap aman dan bisa ditarik ulang).',
      variant: 'danger',
      onConfirm: async () => {
        const db = await initDB()
        const docs = await db.sales.find({ selector: {} }).exec()
        await Promise.all(docs.map((d: any) => d.remove()))
        closeConfirm()
      },
    })
  }

  const handleSync = async () => {
    const db = await initDB()
    const allDocs = await db.sales.find().exec()
    const allData = allDocs.map((d: any) => d.toJSON())
    const unsynced = allData.filter((s: any) => !s.is_synced)

    const processSync = async (dataToSync: any[]) => {
      setIsSyncing(true)
      try {
        if (dataToSync.length > 0) {
          await upsertSalesToDB(dataToSync)

          const ids = dataToSync.map((s: any) => s.transaction_id)
          const docsToUpdate = await db.sales
            .find({ selector: { transaction_id: { $in: ids } } })
            .exec()

          await Promise.all(
            docsToUpdate.map((doc: any) => doc.patch({ is_synced: true })),
          )
        }

        await pullFromSupabase(true)

        closeConfirm()
        setShowToast({
          show: true,
          message: 'Sinkronisasi Supabase Berhasil ✅',
          variant: 'success',
        })
      } catch (e: any) {
        console.error(e)
        closeConfirm()
        setShowToast({
          show: true,
          message: `Gagal Sync: ${e.message || 'Cek koneksi'} ❌`,
          variant: 'error',
        })
      } finally {
        setIsSyncing(false)
      }
    }

    if (unsynced.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Sinkronisasi Data',
        message: `Akan mengirim ${unsynced.length} transaksi ke Supabase dan memuat data terbaru. Lanjutkan?`,
        variant: 'info',
        onConfirm: () => processSync(unsynced),
      })
    } else {
      setConfirmConfig({
        isOpen: true,
        title: 'Sinkronkan Ulang?',
        message:
          'Semua data lokal sudah tersinkron. Kirim ulang seluruh data lokal ke Supabase dan tarik pembaruan terbaru?',
        variant: 'info',
        confirmText: 'Sync Sekarang',
        onConfirm: () => processSync(allData),
      })
    }
  }

  const handleFetchServerData = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Ambil Data Supabase',
      message: 'Tarik riwayat transaksi terbaru dari database Supabase?',
      variant: 'info',
      confirmText: 'Ambil Data',
      onConfirm: async () => {
        await pullFromSupabase(false)
        closeConfirm()
      },
    })
  }

  const handleEdit = (item: SaleDoc) => {
    setEditingItem(item)
  }

  const saveEdit = async (updatedItem: SaleDoc) => {
    try {
      const db = await initDB()
      const doc = await db.sales.findOne(updatedItem.transaction_id).exec()
      if (doc) {
        let newTotal = updatedItem.harga_satuan * updatedItem.qty
        if (updatedItem.type === 'OUT') {
          newTotal = updatedItem.total_harga
        }

        let newDisplayTotal = newTotal
        const pkg = DEFAULT_TICKET_PACKAGES.find(
          (p) =>
            p.variant === updatedItem.variant &&
            p.nominal === updatedItem.harga_satuan,
        )
        if (pkg) {
          newDisplayTotal = pkg.displayNominal * updatedItem.qty
        }

        const patchedFields = {
          nama_barang: updatedItem.nama_barang,
          qty: updatedItem.qty,
          harga_satuan: updatedItem.harga_satuan,
          metode_pembayaran: updatedItem.metode_pembayaran,
          nomor_hp: updatedItem.nomor_hp,
          customer_name: updatedItem.customer_name,
          notes: updatedItem.notes,
          variant: updatedItem.variant,
          total_harga: newTotal,
          display_total: newDisplayTotal,
          is_synced: false,
        }

        await doc.patch(patchedFields)

        if (navigator.onLine) {
          await upsertSalesToDB([{ ...doc.toJSON(), ...patchedFields }])
          await doc.patch({ is_synced: true })
        }
      }
      setEditingItem(null)
      setShowToast({
        show: true,
        message: 'Perubahan berhasil disimpan ✅',
        variant: 'success',
      })
    } catch (err) {
      console.error(err)
      setShowToast({
        show: true,
        message: 'Gagal menyimpan perubahan ❌',
        variant: 'error',
      })
    }
  }

  const deleteItem = () => {
    if (!editingItem) return
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Transaksi?',
      message: 'Data transaksi ini akan ditandai terhapus di lokal dan Supabase.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const db = await initDB()
          const doc = await db.sales.findOne(editingItem.transaction_id).exec()
          if (doc) {
            await doc.patch({ is_deleted: true, is_synced: false })
            if (navigator.onLine) {
              await upsertSalesToDB([
                { ...doc.toJSON(), is_deleted: true },
              ])
              await doc.patch({ is_synced: true })
            }
          }
          setEditingItem(null)
        } catch (err) {
          console.error(err)
        }
        closeConfirm()
      },
    })
  }

  return {
    sales,
    currentCashier,
    isSyncing,
    editingItem,
    setEditingItem,
    confirmConfig,
    showToast,
    setShowToast,
    closeConfirm,
    handleDeleteAll,
    handleSync,
    handleFetchServerData,
    handleEdit,
    saveEdit,
    deleteItem,
  }
}