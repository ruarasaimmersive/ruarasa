import { useState, useEffect } from 'react'
import { addSale, initDB } from '../db'
import { sendWhatsAppNotification } from '../lib/whatsapp'
import type { TicketPackage, PackageGroup } from './PackageKanban'
import {
  DEFAULT_PACKAGE_GROUPS as DEFAULT_GROUPS,
  DEFAULT_TICKET_PACKAGES as DEFAULT_PACKAGES,
  GENERAL_SCRIPT_URL,
} from '../constants'
import { getTicketPackagesFromDB } from '../lib/supabase'
import { PrintReceipt } from './PrintReceipt'
import { getPricing } from '../utils/pricing'
import { TicketPackageSelector } from './cashier/TicketPackageSelector'
import { QuantitySelector } from './cashier/QuantitySelector'
import { PaymentSelector } from './cashier/PaymentSelector'
import { ExpenseForm } from './cashier/ExpenseForm'
import ErrorModal from './ErrorModal'

const PAYMENTS = [
  {
    id: 'CASH',
    label: 'CASH',
    icon: (active: boolean) => (
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        className={active ? 'text-emerald-500' : 'text-zinc-400'}
      >
        <rect x='2' y='5' width='20' height='14' rx='2' />
        <line x1='2' y1='10' x2='22' y2='10' />
      </svg>
    ),
  },
  {
    id: 'QRIS',
    label: 'QRIS',
    icon: (active: boolean) => (
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        className={active ? 'text-blue-500' : 'text-zinc-400'}
      >
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
      </svg>
    ),
  },
]

const InputRekap = () => {
  const [cashierName, setCashierName] = useState('')
  const [products, setProducts] = useState<any[]>([])

  // IN - State
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [phone, setPhone] = useState('+62')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    )
  })
  const [instansi, setInstansi] = useState('') // Customer/Instansi name
  // Dynamic Ticket Packages State
  const [groups, setGroups] = useState<PackageGroup[]>([])
  const [packages, setPackages] = useState<TicketPackage[]>([])
  const [activeGroup, setActiveGroup] = useState<string>('')
  const [activePkg, setActivePkg] = useState<TicketPackage | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Ticker to auto-update time-based pricing rules without refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date()
      setCurrentTime(n)

      setDate((prev) => {
        const todayStr =
          n.getFullYear() +
          '-' +
          String(n.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(n.getDate()).padStart(2, '0')
        const prevDateObj = new Date(prev)
        const diff = n.getTime() - prevDateObj.getTime()
        if (diff > 0 && diff < 172800000) {
          return todayStr
        }
        return prev
      })
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // OUT - State
  const [expenseNote, setExpenseNote] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  // UI State
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN')
  const [submittingType, setSubmittingType] = useState<
    'simpan' | 'cetak' | 'bersihkan' | null
  >(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [isLoadingId, setIsLoadingId] = useState(true)

  // Printing State
  const [isPrintingMode, setIsPrintingMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('is_printing_mode') === 'true'
    }
    return false
  })
  const [unsyncedSales, setUnsyncedSales] = useState<any[]>([])
  const [toastMessage, setToastMessage] = useState('Data Berhasil Disimpan! ✅')

  const populateDailySequence = async (salesList: any[]) => {
    try {
      const db = await initDB()
      const allSalesDocs = await db.sales.find().exec()
      const allSales = allSalesDocs.map((s: any) => s.toJSON())

      return salesList.map((item: any) => {
        const datePrefix = item.tanggal.substring(0, 10)
        const sameDaySales = allSales
          .filter((s: any) => s.type === 'IN' && s.tanggal.startsWith(datePrefix))
          .sort((a: any, b: any) => a.order_id - b.order_id)

        const idx = sameDaySales.findIndex((s: any) => s.transaction_id === item.transaction_id)
        return {
          ...item,
          daily_sequence: idx !== -1 ? idx + 1 : 1,
        }
      })
    } catch (err) {
      console.error('[populateDailySequence] Error:', err)
      return salesList
    }
  }

  const loadUnsyncedSales = async () => {
    try {
      const db = await initDB()
      const docs = await db.sales.find().exec()
      const unsynced = docs
        .map((d: any) => d.toJSON())
        .filter((s: any) => !s.is_synced && s.type === 'IN')
      const processed = await populateDailySequence(unsynced)
      setUnsyncedSales(processed)
    } catch (err) {
      console.error('[loadUnsyncedSales] Error:', err)
    }
  }

  useEffect(() => {
    const name = localStorage.getItem('cashier_name')
    if (!name) {
      window.location.href = '/login-cashier'
      return
    }
    setCashierName(name)
    loadUnsyncedSales()

    // Load products immediately
    const loadProducts = async () => {
      setIsLoadingId(false)

      const db = await initDB()
      const docs = await db.products.find().exec()
      const data = docs.map((d: any) => {
        const p = d.toJSON()
        if (p.name === 'Immersive Edupark') {
          return { ...p, price: 50000 }
        }
        return p
      })
      setProducts(data)
      if (data.length > 0) {
        setSelectedProduct(data[0])
      }
    }
    loadProducts()

    // Load groups (with localStorage fallback)
    const savedGroups = localStorage.getItem('package_groups')
    let g: PackageGroup[] = savedGroups ? JSON.parse(savedGroups) : [...DEFAULT_GROUPS]
    let groupsUpdated = false
    DEFAULT_GROUPS.forEach((dg: any) => {
      if (!g.some((x: any) => x.id === dg.id)) {
        g.push(dg)
        groupsUpdated = true
      }
    })
    if (groupsUpdated) {
      localStorage.setItem('package_groups', JSON.stringify(g))
    }
    setGroups(g)

    // Initial render from localStorage cache (without overwriting edited prices!)
    const savedPkgs = localStorage.getItem('ticket_packages')
    const initialPkgs: TicketPackage[] = savedPkgs
      ? JSON.parse(savedPkgs)
      : [...DEFAULT_PACKAGES]

    setPackages(initialPkgs)
    if (g.length > 0) setActiveGroup(g[0].id)
    if (initialPkgs.length > 0) {
      setActivePkg(initialPkgs.find((p) => p.groupId === g[0]?.id) || initialPkgs[0])
    }

    // Fetch latest prices & packages from Supabase
    getTicketPackagesFromDB()
      .then((rows) => {
        if (!rows || rows.length === 0) return

        // Ensure any custom group from DB exists
        const updatedGroups = [...g]
        let gChanged = false
        rows.forEach((row) => {
          if (!updatedGroups.some((grp) => grp.id === row.group_id)) {
            updatedGroups.push({
              id: row.group_id,
              name: row.group_name || row.group_id,
              defaultVariant: row.variant || 'REGULER',
            })
            gChanged = true
          }
        })
        if (gChanged) {
          setGroups(updatedGroups)
          localStorage.setItem('package_groups', JSON.stringify(updatedGroups))
        }

        const mapped: TicketPackage[] = rows.map((row) => ({
          id: row.id,
          groupId: row.group_id,
          name: row.name,
          variant: row.variant,
          nominal: Number(row.nominal),
          displayNominal: Number(row.display_nominal),
          rules: Array.isArray(row.rules) ? row.rules : [],
          features: Array.isArray(row.features) ? row.features : ['Immersive'],
        }))

        setPackages(mapped)
        localStorage.setItem('ticket_packages', JSON.stringify(mapped))

        setActivePkg((prevActive) => {
          if (prevActive) {
            const refreshedMatch = mapped.find((p) => p.id === prevActive.id)
            if (refreshedMatch) return refreshedMatch
          }
          const targetGroup = updatedGroups[0]?.id
          return mapped.find((p) => p.groupId === targetGroup) || mapped[0] || null
        })
      })
      .catch((err) => {
        console.warn('[InputRekap] Menggunakan cache harga lokal:', err)
      })
  }, [])

  const {
    realTotal: total,
    displayTotal,
    unitReal: effectivePrice,
    splitInfo,
  } = getPricing(activePkg, qty, selectedProduct, currentTime)

  const handleInc = () => setQty((q) => q + 1)
  const handleDec = () => setQty((q) => Math.max(1, q - 1))

  const handleSubmit = async (shouldQueueInput?: boolean) => {
    const shouldQueue =
      typeof shouldQueueInput === 'boolean' ? shouldQueueInput : isPrintingMode

    const parseNominal = (val: string) =>
      val ? parseInt(val.replace(/\./g, '')) : 0

    if (activeTab === 'IN' && !selectedProduct) return

    const isImmersiveProduct =
      selectedProduct?.name.toLowerCase().includes('immersive') ||
      selectedProduct?.name.toLowerCase().includes('tiket') ||
      false
    const isPaketanInOut =
      isImmersiveProduct &&
      (activePkg?.variant === 'OUTING' ||
        (activePkg?.variant !== 'REGULER' &&
          activePkg?.variant !== 'VOUCHER' &&
          activePkg?.name.toLowerCase().includes('paket')) ||
        false)
    if (activeTab === 'IN' && isPaketanInOut && !instansi) {
      setErrorDetails('Mohon isi Nama Instansi / PJ')
      return
    }

    if (activeTab === 'OUT' && (!expenseNote || !expenseAmount)) {
      setErrorDetails('Mohon lengkapi catatan dan nominal pengeluaran')
      return
    }

    setSubmittingType(shouldQueue ? 'cetak' : 'simpan')
    setErrorDetails(null)

    try {
      await new Promise((r) => setTimeout(r, 300))

      const now = new Date()
      const selectedDate = new Date(date)
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())

      const source = 'UMUM'

      if (activeTab === 'IN') {
        const isImmersiveProduct =
          selectedProduct?.name.toLowerCase().includes('immersive') ||
          selectedProduct?.name.toLowerCase().includes('tiket') ||
          false
        const isEvent = isImmersiveProduct && activePkg?.variant === 'EVENT'

        let applyNotes = isImmersiveProduct ? activePkg?.variant || '' : ''

        const baseSaleData = {
          tanggal: selectedDate.toISOString(),
          nama_barang: (() => {
            if (isImmersiveProduct && activePkg) {
              if (activePkg.variant === 'EVENT') {
                const group = groups.find((g) => g.id === activePkg.groupId)
                const groupName = group ? group.name : 'Event'
                return `${groupName} - ${activePkg.name}`
              }
              return activePkg.name
            }
            return selectedProduct.name
          })(),
          metode_pembayaran: paymentMethod,
          nomor_hp: phone,
          customer_name: instansi,
          kasir: cashierName,
          is_synced: false,
          source: source,
          type: 'IN' as const,
          notes: applyNotes,
          variant: isImmersiveProduct
            ? activePkg?.variant || 'REGULER'
            : 'EVENT',
        }

        const savedSales: any[] = []

        if (splitInfo) {
          const doc1 = await addSale({
            ...baseSaleData,
            qty: splitInfo.promoQty,
            harga_satuan: splitInfo.promoPrice,
            total_harga: splitInfo.promoPrice * splitInfo.promoQty,
            display_total: splitInfo.promoDisplay * splitInfo.promoQty,
          })
          savedSales.push(doc1.toJSON())

          if (splitInfo.normalQty > 0) {
            const doc2 = await addSale({
              ...baseSaleData,
              qty: splitInfo.normalQty,
              harga_satuan: splitInfo.normalPrice,
              total_harga: splitInfo.normalPrice * splitInfo.normalQty,
              display_total: splitInfo.normalDisplay * splitInfo.normalQty,
            })
            savedSales.push(doc2.toJSON())
          }
        } else {
          const doc3 = await addSale({
            ...baseSaleData,
            qty: qty,
            harga_satuan: effectivePrice,
            total_harga: total,
            display_total: isImmersiveProduct ? displayTotal : total,
          })
          savedSales.push(doc3.toJSON())
        }

        await loadUnsyncedSales()

        if (shouldQueue) {
          setTimeout(() => {
            handleBatchPrint()
          }, 150)
        }

        if (isEvent) {
          const group = groups.find((g) => g.id === activePkg?.groupId)
          const groupName = group ? group.name : 'Event'
          const productName = `${groupName} - ${activePkg?.name || 'Ticket'}`
          const finalProductName = instansi
            ? `${productName} - ${instansi}`
            : productName

          const items = splitInfo
            ? [
                {
                  product: finalProductName,
                  qty: splitInfo.promoQty,
                  price: splitInfo.promoPrice,
                },
                ...(splitInfo.normalQty > 0
                  ? [
                      {
                        product: finalProductName,
                        qty: splitInfo.normalQty,
                        price: splitInfo.normalPrice,
                      },
                    ]
                  : []),
              ]
            : [
                {
                  product: finalProductName,
                  qty: qty,
                  price: effectivePrice,
                },
              ]

          sendWhatsAppNotification({
            type: 'EVENT_PURCHASE',
            customer: {
              name: instansi || 'Live Customer',
              phone: phone,
            },
            booking: {
              id: 'ONSITE-' + Date.now(),
              items: items,
              total: total,
              date: selectedDate.toISOString(),
              payment_method: paymentMethod,
            },
          })
        }
      } else {
        const expenseVal = parseNominal(expenseAmount)
        await addSale({
          tanggal: selectedDate.toISOString(),
          nama_barang: expenseNote,
          qty: 1,
          harga_satuan: expenseVal,
          total_harga: expenseVal,
          metode_pembayaran: 'CASH',
          nomor_hp: '-',
          kasir: cashierName,
          is_synced: false,
          source: source,
          type: 'OUT',
          notes: expenseNote,
        })
      }

      if (!shouldQueue) {
        setToastMessage('Data Berhasil Disimpan! ✅')
        if (navigator.vibrate) navigator.vibrate(50)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }

      setQty(1)
      setPhone('+62')
      setInstansi('')
      setExpenseNote('')
      setExpenseAmount('')
    } catch (err: any) {
      console.error(err)
      setErrorDetails(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setSubmittingType(null)
    }
  }

  const handleBatchPrint = async () => {
    setSubmittingType('cetak')
    try {
      const db = await initDB()
      const docs = await db.sales.find().exec()
      const latestUnsynced = docs
        .map((d: any) => d.toJSON())
        .filter((s: any) => !s.is_synced && s.type === 'IN')

      if (latestUnsynced.length === 0) {
        setToastMessage('Tidak ada transaksi untuk dicetak 🖨️')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        setSubmittingType(null)
        return
      }

      const processed = await populateDailySequence(latestUnsynced)
      setUnsyncedSales(processed)

      const payload = {
        transactions: latestUnsynced
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
      }

      const syncPromise = fetch(GENERAL_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('[handleBatchPrint] Sync fetch failed:', err)
        throw err
      })

      await new Promise((resolve) => setTimeout(resolve, 300))

      const finalizePrint = async () => {
        try {
          await syncPromise

          const ids = latestUnsynced.map((s: any) => s.transaction_id)
          const docsToUpdate = await db.sales
            .find({ selector: { transaction_id: { $in: ids } } })
            .exec()

          await Promise.all(
            docsToUpdate.map((doc: any) => doc.patch({ is_synced: true })),
          )

          await loadUnsyncedSales()

          setToastMessage('Struk dicetak & sinkronisasi berhasil! 🖨️✅')
          setShowToast(true)
          setTimeout(() => setShowToast(false), 3000)
        } catch (error) {
          console.error('[handleBatchPrint] Error in finalizePrint:', error)
          setToastMessage('Cetak selesai, gagal sinkronisasi otomatis ❌')
          setShowToast(true)
          setTimeout(() => setShowToast(false), 3000)
        } finally {
          setSubmittingType(null)
        }
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      if (isMobile) {
        window.print()
        setTimeout(finalizePrint, 15000)
      } else {
        let finalized = false
        const onAfterPrint = () => {
          if (!finalized) {
            finalized = true
            finalizePrint()
            window.removeEventListener('afterprint', onAfterPrint)
          }
        }
        window.addEventListener('afterprint', onAfterPrint)
        window.print()
        setTimeout(onAfterPrint, 3000)
      }
    } catch (error) {
      console.error('[handleBatchPrint] Error:', error)
      setToastMessage('Cetak selesai, gagal sinkronisasi otomatis ❌')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      setSubmittingType(null)
    }
  }

  const handleClearQueue = async () => {
    setSubmittingType('bersihkan')
    try {
      const db = await initDB()
      const docs = await db.sales.find().exec()
      const latestUnsynced = docs
        .map((d: any) => d.toJSON())
        .filter((s: any) => !s.is_synced && s.type === 'IN')

      if (latestUnsynced.length === 0) {
        setToastMessage('Tidak ada transaksi untuk dibersihkan 🧹')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        setSubmittingType(null)
        return
      }

      const payload = {
        transactions: latestUnsynced
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
      }

      await fetch(GENERAL_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      })

      const ids = latestUnsynced.map((s: any) => s.transaction_id)
      const docsToUpdate = await db.sales
        .find({ selector: { transaction_id: { $in: ids } } })
        .exec()

      await Promise.all(
        docsToUpdate.map((doc: any) => doc.patch({ is_synced: true })),
      )

      await loadUnsyncedSales()

      setToastMessage('Sinkronisasi berhasil & antrean dibersihkan! 🧹✅')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('[handleClearQueue] Error:', error)
      setToastMessage('Gagal membersihkan & sinkronisasi data ❌')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setSubmittingType(null)
    }
  }

  if (products.length === 0 || isLoadingId) {
    return (
      <div className='flex flex-col justify-center items-center min-h-[50vh]'>
        <div className='border-4 border-emerald-500 border-t-transparent rounded-full w-12 h-12 animate-spin'></div>
        {isLoadingId && (
          <p className='mt-4 font-bold text-zinc-500 animate-pulse'>
            Sinkronisasi Data Server...
          </p>
        )}
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-md lg:max-w-4xl animate-in duration-500 fade-in zoom-in-95'>
      <ErrorModal
        isOpen={!!errorDetails}
        message={errorDetails}
        onClose={() => setErrorDetails(null)}
      />

      {showToast && (
        <div className='bottom-24 slide-in-from-bottom-4 left-1/2 z-50 fixed flex items-center gap-3 bg-zinc-900 shadow-xl shadow-zinc-900/20 px-6 py-4 rounded-full text-white -translate-x-1/2 animate-in duration-300 fade-in'>
          <span className='font-bold text-sm whitespace-nowrap'>
            {toastMessage}
          </span>
        </div>
      )}

      <div className='relative bg-white md:bg-white/60 md:dark:bg-zinc-900/60 dark:bg-zinc-900 shadow-none md:shadow-xl p-6 md:p-8 md:rounded-[2.5rem] ring-0 ring-zinc-200 md:ring-1 dark:ring-zinc-700 min-h-[50vh] md:min-h-0 overflow-hidden transition-all glass-card'>
        <div className='mb-8 text-center'>
          <h1 className='font-extrabold text-zinc-900 dark:text-white text-2xl'>
            Input {activeTab === 'IN' ? 'Pesanan' : 'Pengeluaran'}
          </h1>
          <p className='font-medium text-zinc-600 dark:text-zinc-400 text-sm'>
            {cashierName}
          </p>
        </div>

        <div className='mb-6'>
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className='bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none ring-emerald-500/20 focus:ring-2 w-full font-bold text-zinc-900 dark:text-white dark:scheme-dark'
          />
        </div>

        <div className='flex bg-zinc-100 dark:bg-zinc-800/80 mb-8 p-1 rounded-2xl'>
          <button
            onClick={() => setActiveTab('IN')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'IN' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            PEMASUKAN
          </button>
          <button
            onClick={() => setActiveTab('OUT')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'OUT' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            PENGELUARAN
          </button>
        </div>

        {activeTab === 'IN' && (
          <div className='slide-in-from-right-4 lg:gap-8 lg:grid lg:grid-cols-2 animate-in duration-300 fade-in'>
            <div className='flex flex-col'>
              <TicketPackageSelector
                products={products}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                groups={groups}
                packages={packages}
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                activePkg={activePkg}
                setActivePkg={setActivePkg}
                qty={qty}
                currentTime={currentTime}
              />

              <QuantitySelector
                qty={qty}
                setQty={setQty}
                handleInc={handleInc}
                handleDec={handleDec}
              />
            </div>

            <div className='flex flex-col mt-8 lg:mt-0 h-full'>
              {(activePkg?.variant === 'OUTING' ||
                (activePkg?.variant !== 'REGULER' &&
                  activePkg?.variant !== 'VOUCHER' &&
                  activePkg?.name.toLowerCase().includes('paket'))) &&
                activePkg?.variant !== 'EVENT' && (
                  <div className='flex flex-col gap-4 slide-in-from-top-2 mb-8 animate-in'>
                    <div>
                      <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                        Nama Instansi / PJ
                      </label>
                      <input
                        type='text'
                        placeholder='TK Tunjung Sari'
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        className='bg-zinc-50 dark:bg-zinc-800 p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none ring-emerald-500/20 focus:ring-2 w-full font-bold text-zinc-900 dark:text-white'
                      />
                    </div>
                    <div>
                      <label className='block mb-2 font-bold text-zinc-500 text-xs uppercase'>
                        Nomor HP (Opsional)
                      </label>
                      <input
                        type='tel'
                        placeholder='Nomor HP Pelanggan'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className='bg-zinc-50 dark:bg-zinc-800 p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none ring-emerald-500/20 focus:ring-2 w-full font-bold text-zinc-900 dark:text-white text-left'
                      />
                    </div>
                  </div>
                )}

              <PaymentSelector
                total={total}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

              {isPrintingMode ? (
                <div className='flex flex-col gap-3 w-full animate-in fade-in duration-300'>
                  <button
                    type='button'
                    onClick={() => handleSubmit(false)}
                    disabled={submittingType !== null}
                    className='flex justify-center items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-70 py-4 rounded-2xl w-full font-extrabold text-white dark:text-zinc-900 text-base hover:scale-[1.005] active:scale-[0.995] transition-all border border-zinc-900 dark:border-white cursor-pointer disabled:cursor-not-allowed'
                  >
                    {submittingType === 'simpan' ? (
                      <div className='border-4 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full w-5 h-5 animate-spin'></div>
                    ) : (
                      'Simpan Transaksi'
                    )}
                  </button>

                  <div className='flex sm:flex-row flex-col gap-3 w-full'>
                    <button
                      type='button'
                      onClick={() => handleBatchPrint()}
                      disabled={submittingType !== null || unsyncedSales.length === 0}
                      className='flex flex-1 justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:dark:text-zinc-500 disabled:shadow-none shadow-emerald-500/20 shadow-lg hover:shadow-xl py-4 rounded-2xl font-black text-white text-base hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed'
                    >
                      {submittingType === 'cetak' ? (
                        <div className='border-4 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin'></div>
                      ) : (
                        `Cetak Transaksi (${unsyncedSales.length})`
                      )}
                    </button>

                    <button
                      type='button'
                      onClick={() => handleClearQueue()}
                      disabled={submittingType !== null || unsyncedSales.length === 0}
                      className='flex flex-1 justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:dark:text-zinc-500 disabled:shadow-none shadow-amber-500/20 shadow-lg hover:shadow-xl py-4 rounded-2xl font-black text-white text-base hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed'
                      title='Bersihkan antrean cetak tanpa mencetak, lalu langsung sinkronisasikan ke server'
                    >
                      {submittingType === 'bersihkan' ? (
                        <div className='border-4 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin'></div>
                      ) : (
                        'Bersihkan'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submittingType !== null}
                  className='flex justify-center items-center gap-2 bg-zinc-900 dark:bg-white disabled:opacity-70 shadow-xl shadow-zinc-900/20 hover:shadow-2xl py-5 rounded-2xl w-full font-black text-white dark:text-zinc-900 text-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed'
                >
                  {submittingType === 'simpan' ? (
                    <div className='border-4 border-white/30 border-t-white rounded-full w-6 h-6 animate-spin'></div>
                  ) : (
                    'Simpan Transaksi →'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'OUT' && (
          <ExpenseForm
            expenseNote={expenseNote}
            setExpenseNote={setExpenseNote}
            expenseAmount={expenseAmount}
            setExpenseAmount={setExpenseAmount}
            onSubmit={() => handleSubmit(false)}
            isSubmitting={submittingType === 'simpan'}
          />
        )}
      </div>

      {unsyncedSales.length > 0 && (
        <PrintReceipt sales={unsyncedSales} />
      )}
    </div>
  )
}

export default InputRekap