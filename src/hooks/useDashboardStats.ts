import { useState, useEffect } from 'react'
import { initDB, type SaleDoc } from '../db'
import type { BreakdownData } from '../utils/whatsappFormatter'
import { DEFAULT_PACKAGE_GROUPS, DEFAULT_TICKET_PACKAGES } from '../constants'

const getReportedTotal = (s: any) => {
  if (s.type === 'OUT') return s.total_harga
  return typeof s.display_total === 'number' ? s.display_total : s.total_harga
}

const formatFeatureList = (features: string[]): string => {
  if (features.length === 0) return ''
  if (features.length === 1) return features[0]
  if (features.length === 2) return `${features[0]} dan ${features[1]}`
  return `${features.slice(0, -1).join(', ')} dan ${features[features.length - 1]}`
}

export const useDashboardStats = () => {
  const [sales, setSales] = useState<SaleDoc[]>([])
  const [dailyTarget, setDailyTarget] = useState(3000000)
  const [excludedPackages, setExcludedPackages] = useState<string[]>([])
  const [ticketPackages, setTicketPackages] = useState<any[]>([])
  const [packageGroups, setPackageGroups] = useState<any[]>([])
  const [customNominals, setCustomNominals] = useState<Record<string, number>>({})

  useEffect(() => {
    const savedTarget = localStorage.getItem('daily_target')
    if (savedTarget) setDailyTarget(parseInt(savedTarget))

    const storedExcluded = localStorage.getItem('omzet_excluded_packages')
    if (storedExcluded) setExcludedPackages(JSON.parse(storedExcluded))

    const savedPkgs = localStorage.getItem('ticket_packages')
    if (savedPkgs) setTicketPackages(JSON.parse(savedPkgs))

    const savedGroups = localStorage.getItem('package_groups')
    if (savedGroups) setPackageGroups(JSON.parse(savedGroups))

    const storedCustom = localStorage.getItem('omzet_custom_nominals')
    if (storedCustom) setCustomNominals(JSON.parse(storedCustom))
  }, [])

  useEffect(() => {
    let sub: any
    let isMounted = true
    const load = async () => {
      const db = await initDB()
      if (!isMounted) return
      sub = db.sales.find().$.subscribe((docs: any[]) => {
        const data = docs.map((d) => d.toJSON())
        setSales(data)
      })
    }
    load()
    return () => {
      isMounted = false
      if (sub) sub.unsubscribe()
    }
  }, [])

  const updateDailyTarget = (target: number) => {
    setDailyTarget(target)
    localStorage.setItem('daily_target', target.toString())
  }

  const pkgs = ticketPackages.length > 0 ? ticketPackages : DEFAULT_TICKET_PACKAGES
  const groups = packageGroups.length > 0 ? packageGroups : DEFAULT_PACKAGE_GROUPS

  const findMatchedPackage = (s: any) => {
    return pkgs.find((p: any) => {
      if (p.variant === 'EVENT') {
        const group = groups.find((g: any) => g.id === p.groupId)
        const groupName = group ? group.name : 'Event'
        const expectedName = `${groupName} - ${p.name}`
        return s.nama_barang === expectedName
      }
      return s.nama_barang === p.name
    })
  }

  const getResolvedPrice = (s: any) => {
    if (s.type === 'OUT') return s.total_harga

    const matchedPkg = findMatchedPackage(s)
    if (matchedPkg && customNominals[matchedPkg.id] !== undefined) {
      return customNominals[matchedPkg.id] * s.qty
    }
    return getReportedTotal(s)
  }

  const buildPackageDetailLabel = (
    categoryLabel: 'Reguler' | 'Pelajar',
    s: any,
    priceLabel: string | number,
  ) => {
    const rawName = (s.nama_barang || '').trim()
    const cleanName = rawName.replace(/^paket\s+/i, '').trim()

    if (!cleanName || cleanName.toLowerCase() === categoryLabel.toLowerCase()) {
      return `${categoryLabel} (${priceLabel})`
    }

    const matchedPkg = findMatchedPackage(s)
    const features: string[] = Array.isArray(matchedPkg?.features)
      ? matchedPkg.features.filter(Boolean)
      : []

    if (features.length > 1) {
      return `${categoryLabel} ${cleanName} Include ${formatFeatureList(features)} (${priceLabel})`
    }

    return `${categoryLabel} ${cleanName} (${priceLabel})`
  }

  // Today Only & Filtered by Excluded Packages
  const dashboardDocs = sales.filter((s) => {
    if (s.is_deleted) return false
    const d = new Date(s.tanggal)
    const now = new Date()
    if (d.toDateString() !== now.toDateString()) return false

    if (s.type === 'OUT') return true
    if (excludedPackages.length === 0) return true

    const matchedPkg = findMatchedPackage(s)
    if (matchedPkg) {
      return !excludedPackages.includes(matchedPkg.id)
    }
    return true
  })

  const txCount = dashboardDocs.length

  let incomeReguler = 0
  let incomePelajar = 0
  let incomeEvent = 0
  let incomeVoucher = 0
  let paxReguler = 0
  let paxPelajar = 0
  let paxEvent = 0
  let paxVoucher = 0

  let incomePaketan = 0
  const paketanBreakdown: Record<string, { qty: number; total: number }> = {}
  const pelajarBreakdown: Record<string, { qty: number; total: number }> = {}
  const regulerBreakdown: Record<string, { qty: number; total: number }> = {}
  const voucherBreakdown: Record<string, { qty: number; total: number }> = {}
  const eventBreakdown: Record<string, { qty: number; total: number }> = {}

  dashboardDocs.forEach((s) => {
    if (s.type === 'OUT') return

    const val = getResolvedPrice(s)
    const variant = (s.variant || s.notes || '').toUpperCase()

    if (variant.includes('OUTING') || variant.includes('PAKETAN')) {
      incomePaketan += val
      const custName = s.customer_name || 'Umum'
      if (!paketanBreakdown[custName]) {
        paketanBreakdown[custName] = { qty: 0, total: 0 }
      }
      paketanBreakdown[custName].qty += s.qty
      paketanBreakdown[custName].total += val
    } else if (variant.includes('PELAJAR')) {
      incomePelajar += val
      paxPelajar += s.qty
      const pricePerPax = s.qty > 0 ? Math.round(val / s.qty) : val
      const label =
        pricePerPax >= 1000
          ? `${Math.round(pricePerPax / 1000)}rb`
          : pricePerPax
      const key = buildPackageDetailLabel('Pelajar', s, label)
      if (!pelajarBreakdown[key]) {
        pelajarBreakdown[key] = { qty: 0, total: 0 }
      }
      pelajarBreakdown[key].qty += s.qty
      pelajarBreakdown[key].total += val
    } else if (variant.includes('EVENT')) {
      incomeEvent += val
      paxEvent += s.qty
      const eventName = s.nama_barang || 'Event Lainnya'
      if (!eventBreakdown[eventName]) {
        eventBreakdown[eventName] = { qty: 0, total: 0 }
      }
      eventBreakdown[eventName].qty += s.qty
      eventBreakdown[eventName].total += val
    } else if (variant.includes('VOUCHER')) {
      incomeVoucher += val
      paxVoucher += s.qty
      const voucherName = s.nama_barang || 'Voucher'
      if (!voucherBreakdown[voucherName]) {
        voucherBreakdown[voucherName] = { qty: 0, total: 0 }
      }
      voucherBreakdown[voucherName].qty += s.qty
      voucherBreakdown[voucherName].total += val
    } else {
      incomeReguler += val
      paxReguler += s.qty
      const pricePerPax = s.qty > 0 ? Math.round(val / s.qty) : val
      const label =
        pricePerPax >= 1000
          ? `${Math.round(pricePerPax / 1000)}rb`
          : pricePerPax
      const key = buildPackageDetailLabel('Reguler', s, label)
      if (!regulerBreakdown[key]) {
        regulerBreakdown[key] = { qty: 0, total: 0 }
      }
      regulerBreakdown[key].qty += s.qty
      regulerBreakdown[key].total += val
    }
  })

  const generalIncome =
    incomeReguler + incomePelajar + incomePaketan + incomeEvent + incomeVoucher

  const generalExpense = dashboardDocs.reduce((acc, s) => {
    return s.type === 'OUT' ? acc + s.total_harga : acc
  }, 0)

  const generalNet = generalIncome - generalExpense

  const qrisSales = dashboardDocs.filter(
    (s) => s.metode_pembayaran === 'QRIS' && s.type !== 'OUT',
  )
  const cashSales = dashboardDocs.filter(
    (s) => s.metode_pembayaran === 'CASH' && s.type !== 'OUT',
  )

  const qrisCount = qrisSales.length
  const cashCount = cashSales.length

  const websiteSales = dashboardDocs.filter(
    (s) => s.metode_pembayaran === 'Website' && s.type !== 'OUT',
  )
  const websiteCount = websiteSales.length
  const websiteTotal = websiteSales.reduce(
    (acc, c) => acc + getResolvedPrice(c),
    0,
  )
  const websiteQty = websiteSales.reduce((acc, c) => acc + c.qty, 0)

  const qrisTotal = qrisSales.reduce((acc, c) => acc + getResolvedPrice(c), 0)
  const qrisQty = qrisSales.reduce((acc, c) => acc + c.qty, 0)

  const cashTotal = cashSales.reduce((acc, c) => acc + getResolvedPrice(c), 0)
  const cashQty = cashSales.reduce((acc, c) => acc + c.qty, 0)

  const getBreakdownByMethod = (method: string): BreakdownData => {
    let reg = 0
    let plj = 0
    let pkt = 0
    let evt = 0
    let vch = 0
    let regPax = 0
    let pljPax = 0
    let pktPax = 0
    let evtPax = 0
    let vchPax = 0
    const regulerDetails: Record<string, { qty: number; total: number }> = {}
    const pelajarDetails: Record<string, { qty: number; total: number }> = {}
    const outingDetails: Record<string, { qty: number; total: number }> = {}
    const eventDetails: Record<string, { qty: number; total: number }> = {}
    const voucherDetails: Record<string, { qty: number; total: number }> = {}

    dashboardDocs.forEach((s) => {
      if (s.metode_pembayaran !== method || s.type === 'OUT') return

      const val = getResolvedPrice(s)
      const variant = (s.variant || s.notes || '').toUpperCase()

      if (variant.includes('OUTING') || variant.includes('PAKETAN')) {
        pkt += val
        pktPax += s.qty
        const custName = s.customer_name || 'Umum'
        if (!outingDetails[custName]) {
          outingDetails[custName] = { qty: 0, total: 0 }
        }
        outingDetails[custName].qty += s.qty
        outingDetails[custName].total += val
      } else if (variant.includes('PELAJAR')) {
        plj += val
        pljPax += s.qty
        const pricePerPax = s.qty > 0 ? Math.round(val / s.qty) : val
        const label =
          pricePerPax >= 1000
            ? `${Math.round(pricePerPax / 1000)}rb`
            : pricePerPax
        const key = buildPackageDetailLabel('Pelajar', s, label)
        if (!pelajarDetails[key]) {
          pelajarDetails[key] = { qty: 0, total: 0 }
        }
        pelajarDetails[key].qty += s.qty
        pelajarDetails[key].total += val
      } else if (variant.includes('EVENT')) {
        evt += val
        evtPax += s.qty
        let eventName = s.nama_barang || 'Event Lainnya'
        if (eventName.includes(' - ')) {
          eventName = eventName.split(' - ').slice(1).join(' - ')
        }
        if (!eventDetails[eventName]) {
          eventDetails[eventName] = { qty: 0, total: 0 }
        }
        eventDetails[eventName].qty += s.qty
        eventDetails[eventName].total += val
      } else if (variant.includes('VOUCHER')) {
        vch += val
        vchPax += s.qty
        const voucherName = s.nama_barang || 'Voucher'
        if (!voucherDetails[voucherName]) {
          voucherDetails[voucherName] = { qty: 0, total: 0 }
        }
        voucherDetails[voucherName].qty += s.qty
        voucherDetails[voucherName].total += val
      } else {
        reg += val
        regPax += s.qty
        const pricePerPax = s.qty > 0 ? Math.round(val / s.qty) : val
        const label =
          pricePerPax >= 1000
            ? `${Math.round(pricePerPax / 1000)}rb`
            : pricePerPax
        const key = buildPackageDetailLabel('Reguler', s, label)
        if (!regulerDetails[key]) {
          regulerDetails[key] = { qty: 0, total: 0 }
        }
        regulerDetails[key].qty += s.qty
        regulerDetails[key].total += val
      }
    })

    return {
      reg,
      plj,
      pkt,
      evt,
      vch,
      regPax,
      pljPax,
      pktPax,
      evtPax,
      vchPax,
      outingDetails,
      eventDetails,
      pelajarDetails,
      regulerDetails,
      voucherDetails,
    }
  }

  const qrisBreakdown = getBreakdownByMethod('QRIS')
  const cashBreakdown = getBreakdownByMethod('CASH')
  const websiteBreakdown = getBreakdownByMethod('Website')

  return {
    dashboardDocs,
    txCount,
    incomeReguler,
    incomePelajar,
    incomeEvent,
    incomeVoucher,
    incomePaketan,
    paxReguler,
    paxPelajar,
    paxEvent,
    paxVoucher,
    paketanBreakdown,
    pelajarBreakdown,
    regulerBreakdown,
    voucherBreakdown,
    eventBreakdown,
    generalIncome,
    generalExpense,
    generalNet,
    dailyTarget,
    updateDailyTarget,
    qrisTotal,
    qrisQty,
    qrisCount,
    cashTotal,
    cashQty,
    cashCount,
    websiteTotal,
    websiteQty,
    websiteCount,
    qrisBreakdown,
    cashBreakdown,
    websiteBreakdown,
  }
}