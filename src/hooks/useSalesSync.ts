import { useState, useEffect } from 'react'
import { initDB, type SaleDoc } from '../db'
import { GENERAL_SCRIPT_URL, DEFAULT_TICKET_PACKAGES } from '../constants'

export const useSalesSync = () => {
  const [sales, setSales] = useState<SaleDoc[]>([])
  const [currentCashier, setCurrentCashier] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingItem, setEditingItem] = useState<SaleDoc | null>(null)

  // Confirmation State
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

  // Toast State
  const [showToast, setShowToast] = useState({
    show: false,
    message: '',
    variant: 'success' as 'success' | 'error',
  })

  const closeConfirm = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }))

  useEffect(() => {
    const name = localStorage.getItem('cashier_name') || ''
    setCurrentCashier(name)
    const selector = {}

    let sub: any
    let isMounted = true
    const load = async () => {
      const db = await initDB()
      if (!isMounted) return
      sub = db.sales
        .find({
          selector: selector,
          sort: [{ order_id: 'desc' }],
        })
        .$.subscribe((docs: any[]) => {
          setSales(docs.map((d) => d.toJSON()))
        })
    }
    load()
    return () => {
      isMounted = false
      if (sub) sub.unsubscribe()
    }
  }, [])

  const handleDeleteAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Semua Data?',
      message:
        'Semua riwayat transaksi (sesuai peran anda) akan dihapus permanen dari perangkat ini.',
      variant: 'danger',
      onConfirm: async () => {
        const db = await initDB()
        const selector = {}
        const docs = await db.sales.find({ selector }).exec()
        await Promise.all(docs.map((d: any) => d.remove()))
        closeConfirm()
      },
    })
  }

  const handleSync = async () => {
    const db = await initDB()
    const allDocs = await db.sales.find().exec()
    const allData = allDocs.map((d: any) => d.toJSON())

    // Filter unsynced
    const unsynced = allData.filter((s: any) => !s.is_synced)

    const processSync = async (dataToSync: any[]) => {
      setIsSyncing(true)

      const mapPayload = (items: any[]) => ({
        transactions: items
          .sort(
            (a: any, b: any) =>
              new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
          )
          .map((t: any) => {
            const variant = t.variant || '-'
            const displayTotal = t.display_total ?? t.total_harga

            return {
              transaction_id: t.transaction_id,
              local_id: t.transaction_id,
              order_id: t.order_id,
              timestamp: t.tanggal,
              product: t.nama_barang,
              quantity: t.qty,
              total_price: Number(t.total_harga) || 0,
              display_price: Number(displayTotal) || 0,
              variant: variant,
              payment: t.metode_pembayaran || 'CASH',
              cashier: t.kasir,
              customer: t.customer_name || '',
              no_telp: t.nomor_hp || '',
              is_dp: t.is_dp || false,
              dp_amount: t.dp_amount || 0,
              type: t.type || 'IN',
              notes: t.notes || '',
              deleted: t.is_deleted || false,
            }
          }),
      })

      try {
        if (dataToSync.length > 0) {
          await fetch(GENERAL_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(mapPayload(dataToSync)),
          })
        }

        const ids = dataToSync.map((s: any) => s.transaction_id)
        const docsToUpdate = await db.sales
          .find({ selector: { transaction_id: { $in: ids } } })
          .exec()

        await Promise.all(
          docsToUpdate.map((doc: any) => doc.patch({ is_synced: true })),
        )

        closeConfirm()
        setShowToast({
          show: true,
          message: 'Sync Berhasil ✅',
          variant: 'success',
        })
      } catch (e) {
        console.error(e)
        closeConfirm()
        setShowToast({
          show: true,
          message: 'Gagal Sync ❌',
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
        message: `Akan mengirim ${unsynced.length} transaksi update/hapus ke server. Lanjutkan?`,
        variant: 'info',
        onConfirm: () => processSync(unsynced),
      })
    } else {
      setConfirmConfig({
        isOpen: true,
        title: 'Semua Data Tersinkron',
        message:
          'Data lokal sudah bersih. Apakah anda ingin MENGIRIM ULANG semua data ke server? (Pilih ini jika data di spreadsheet rusak/kosong).',
        variant: 'info',
        confirmText: 'Resync Semua',
        onConfirm: () => processSync(allData),
      })
    }
  }

  const handleFetchServerData = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Ambil Data Server',
      message:
        'Ambil data transaksi terakhir dari Server? Data lokal saat ini kosong.',
      variant: 'info',
      confirmText: 'Ambil Data',
      onConfirm: async () => {
        setIsSyncing(true)
        try {
          const res = await fetch(`${GENERAL_SCRIPT_URL}?action=read`)
          const json = await res.json()
          let data = json.data || json

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Data tidak ditemukan atau format salah')
          }

          const todayStr = new Date().toDateString()
          const hasToday = data.some(
            (r: any) => new Date(r.timestamp).toDateString() === todayStr,
          )

          if (hasToday) {
            data = data.filter(
              (r: any) => new Date(r.timestamp).toDateString() === todayStr,
            )
          } else {
            data.sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            const latestEst = new Date(data[0].timestamp).toDateString()
            data = data.filter(
              (r: any) => new Date(r.timestamp).toDateString() === latestEst,
            )
          }

          const mappedDocs = data.map((r: any) => {
            const variantStr = r.variant
              ? String(r.variant).trim().toUpperCase()
              : ''
            let type = r.type || 'IN'

            if (!r.type) {
              if (variantStr === '-') {
                type = 'OUT'
              } else if (variantStr === 'EVENT') {
                type = 'IN'
              }
            }

            let notes = r.notes ? String(r.notes) : ''
            if (variantStr && variantStr !== '-' && variantStr !== '') {
              notes = variantStr
            }

            const qtyVal = Number(r.quantity ?? r.qty ?? 1)
            const totalPriceVal = Number(r.total_price ?? r.total_harga ?? 0)
            const displayPriceVal = Number(r.display_price ?? r.display_total ?? totalPriceVal)
            const orderIdVal = Number(r.order_id ?? 0)

            const rawTxId = r.local_id ?? r.transaction_id
            const transactionIdVal = rawTxId ? String(rawTxId) : crypto.randomUUID()

            const rawTanggal = r.timestamp ?? r.tanggal
            const tanggalVal = rawTanggal ? new Date(rawTanggal).toISOString() : new Date().toISOString()

            const itemNameVal = String(r.product ?? r.item_name ?? r.nama_barang ?? 'Item Server')
            const paymentVal = String(r.payment ?? r.metode_pembayaran ?? 'CASH')
            const cashierVal = String(r.cashier ?? r.kasir ?? 'Server')
            const customerNameVal = String(r.customer ?? r.customer_name ?? '')
            const phoneVal = String(r.no_telp ?? r.phone ?? r.nomor_hp ?? '-')

            const isDeletedVal = String(r.deleted ?? r.is_deleted ?? 'false').toUpperCase() === 'TRUE'

            return {
              transaction_id: transactionIdVal,
              order_id: orderIdVal,
              tanggal: tanggalVal,
              nama_barang: itemNameVal,
              qty: qtyVal,
              harga_satuan: qtyVal > 0 ? totalPriceVal / qtyVal : 0,
              total_harga: totalPriceVal,
              display_total: displayPriceVal,
              metode_pembayaran: paymentVal,
              kasir: cashierVal,
              customer_name: customerNameVal,
              nomor_hp: phoneVal,
              source: 'UMUM',
              type: type,
              is_synced: true,
              is_deleted: isDeletedVal,
              notes: notes,
              variant: variantStr,
            }
          })

          const db = await initDB()
          await db.sales.bulkUpsert(mappedDocs)

          setShowToast({
            show: true,
            message: `Berhasil mengambil ${mappedDocs.length} data! ✅`,
            variant: 'success',
          })
        } catch (e: any) {
          console.error(e)
          setShowToast({
            show: true,
            message: `Gagal ambil data: ${e.message} ❌`,
            variant: 'error',
          })
        } finally {
          setIsSyncing(false)
          closeConfirm()
        }
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
        const isToday =
          new Date(doc.tanggal).toDateString() === new Date().toDateString()

        let newTotal = updatedItem.harga_satuan * updatedItem.qty
        if (updatedItem.type === 'OUT') {
          newTotal = updatedItem.total_harga
        }

        let newDisplayTotal = newTotal
        const pkg = DEFAULT_TICKET_PACKAGES.find(
          (p) => p.variant === updatedItem.variant && p.nominal === updatedItem.harga_satuan
        )
        if (pkg) {
          newDisplayTotal = pkg.displayNominal * updatedItem.qty
        }

        await doc.patch({
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
          is_synced: isToday ? false : doc.is_synced,
        })
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
      message: 'Data transaksi ini akan dihapus permanen.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const db = await initDB()
          const doc = await db.sales.findOne(editingItem.transaction_id).exec()
          if (doc) {
            const isToday =
              new Date(doc.tanggal).toDateString() === new Date().toDateString()

            if (doc.is_synced && isToday) {
              await doc.patch({ is_deleted: true, is_synced: false })
            } else {
              await doc.remove()
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
