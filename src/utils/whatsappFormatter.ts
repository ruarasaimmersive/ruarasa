import type { SaleDoc } from '../db'
import { DEFAULT_PACKAGE_GROUPS } from '../constants'

export interface BreakdownData {
  reg: number
  plj: number
  pkt: number
  evt: number
  vch: number
  regPax: number
  pljPax: number
  pktPax: number
  evtPax: number
  vchPax: number
  outingDetails: Record<string, { qty: number; total: number }>
  eventDetails: Record<string, { qty: number; total: number }>
  pelajarDetails: Record<string, { qty: number; total: number }>
  regulerDetails: Record<string, { qty: number; total: number }>
  voucherDetails: Record<string, { qty: number; total: number }>
}

export const generateWAMessage = ({
  cashBreakdown,
  qrisBreakdown,
  websiteBreakdown,
  dashboardDocs,
  cashTotal,
  qrisTotal,
  generalExpense,
}: {
  cashBreakdown: BreakdownData
  qrisBreakdown: BreakdownData
  websiteBreakdown: BreakdownData
  dashboardDocs: SaleDoc[]
  cashTotal: number
  qrisTotal: number
  generalExpense: number
}) => {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const eventGroup = DEFAULT_PACKAGE_GROUPS.find((g) => g.defaultVariant === 'EVENT')
  const eventGroupName = eventGroup ? eventGroup.name : 'Event'

  const formatLine = (label: string, pax: number, total: number) => {
    if (pax === 0) return `${label} : -`
    const pricePerPax = total / pax
    return `${label} : ${pax} org × Rp ${pricePerPax.toLocaleString('id-ID')} = Rp ${total.toLocaleString('id-ID')}`
  }

  const cRegPax = cashBreakdown.regPax
  const qRegPax = qrisBreakdown.regPax
  const cPljPax = cashBreakdown.pljPax
  const qPljPax = qrisBreakdown.pljPax

  const webTotal =
    websiteBreakdown.reg +
    websiteBreakdown.plj +
    websiteBreakdown.pkt +
    websiteBreakdown.evt +
    websiteBreakdown.vch
  const webPax =
    websiteBreakdown.regPax +
    websiteBreakdown.pljPax +
    websiteBreakdown.pktPax +
    websiteBreakdown.evtPax +
    websiteBreakdown.vchPax

  const cPktPax = cashBreakdown.pktPax
  const qPktPax = qrisBreakdown.pktPax

  let msg = `*${today}*\n\n`

  if (cRegPax > 0) {
    Object.keys(cashBreakdown.regulerDetails).forEach((lbl) => {
      const detail = cashBreakdown.regulerDetails[lbl]
      msg += `${formatLine(`Cash ${lbl}`, detail.qty, detail.total)}\n`
    })
  }
  if (qRegPax > 0) {
    Object.keys(qrisBreakdown.regulerDetails).forEach((lbl) => {
      const detail = qrisBreakdown.regulerDetails[lbl]
      msg += `${formatLine(`Qris ${lbl}`, detail.qty, detail.total)}\n`
    })
  }

  if (cPljPax > 0) {
    Object.keys(cashBreakdown.pelajarDetails).forEach((lbl) => {
      const detail = cashBreakdown.pelajarDetails[lbl]
      msg += `${formatLine(`Cash ${lbl}`, detail.qty, detail.total)}\n`
    })
  }
  if (qPljPax > 0) {
    Object.keys(qrisBreakdown.pelajarDetails).forEach((lbl) => {
      const detail = qrisBreakdown.pelajarDetails[lbl]
      msg += `${formatLine(`Qris ${lbl}`, detail.qty, detail.total)}\n`
    })
  }

  if (cPktPax > 0) {
    Object.keys(cashBreakdown.outingDetails).forEach((custName) => {
      const detail = cashBreakdown.outingDetails[custName]
      msg += `${formatLine(`Cash Outing (${custName})`, detail.qty, detail.total)}\n`
    })
  }
  if (qPktPax > 0) {
    Object.keys(qrisBreakdown.outingDetails).forEach((custName) => {
      const detail = qrisBreakdown.outingDetails[custName]
      msg += `${formatLine(`Qris Outing (${custName})`, detail.qty, detail.total)}\n`
    })
  }

  if (cashBreakdown.vchPax > 0) {
    Object.keys(cashBreakdown.voucherDetails).forEach((vchName) => {
      const detail = cashBreakdown.voucherDetails[vchName]
      msg += `${formatLine(`Cash Voucher (${vchName})`, detail.qty, detail.total)}\n`
    })
  }
  if (qrisBreakdown.vchPax > 0) {
    Object.keys(qrisBreakdown.voucherDetails).forEach((vchName) => {
      const detail = qrisBreakdown.voucherDetails[vchName]
      msg += `${formatLine(`Qris Voucher (${vchName})`, detail.qty, detail.total)}\n`
    })
  }

  Object.keys(cashBreakdown.eventDetails).forEach((evtName) => {
    const detail = cashBreakdown.eventDetails[evtName]
    msg += `${formatLine(`Cash ${eventGroupName} (${evtName})`, detail.qty, detail.total)}\n`
  })
  Object.keys(qrisBreakdown.eventDetails).forEach((evtName) => {
    const detail = qrisBreakdown.eventDetails[evtName]
    msg += `${formatLine(`Qris ${eventGroupName} (${evtName})`, detail.qty, detail.total)}\n`
  })

  const expenses = dashboardDocs.filter((s) => s.type === 'OUT')
  let expenseString = 'Cash Bon: '
  if (expenses.length === 0) {
    expenseString += '-'
  } else {
    expenseString +=
      '\n' +
      expenses
        .map(
          (e) =>
            `- ${e.nama_barang}: Rp ${e.total_harga.toLocaleString('id-ID')}`,
        )
        .join('\n')
  }

  let setoranString = `Total Cash Disetor : Rp ${cashTotal.toLocaleString('id-ID')}`
  if (generalExpense > 0) {
    setoranString = `Total Cash Disetor : Rp ${cashTotal.toLocaleString('id-ID')} - Rp ${generalExpense.toLocaleString('id-ID')} = Rp ${(cashTotal - generalExpense).toLocaleString('id-ID')}`
  }

  msg += `Tiket Online Reguler : ${webPax > 0 ? `${webPax} org = Rp ${webTotal.toLocaleString('id-ID')}` : '-'}\n`
  msg += `${expenseString}\n`
  msg += `Pembelian : -\n`
  msg += `Pengembalian/Susuk : -\n`
  msg += `Total Cash : Rp ${cashTotal.toLocaleString('id-ID')}\n`
  msg += `Total Qris : Rp ${qrisTotal.toLocaleString('id-ID')}\n`
  msg += `${setoranString}`

  return msg
}