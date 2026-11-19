import React from 'react'
import { createPortal } from 'react-dom'

interface SaleItem {
  tanggal: string
  nama_barang: string
  harga_satuan: number
  total_harga: number
  metode_pembayaran?: string
  kasir?: string
  daily_sequence?: number
  qty: number
  variant?: string
  display_total?: number
  type?: 'IN' | 'OUT'
}

interface PrintReceiptProps {
  sales: SaleItem[]
}

const centerAlign = (text: string, width = 32) => {
  const space = Math.floor((width - text.length) / 2)
  return ' '.repeat(Math.max(0, space)) + text
}

const formatReceiptLine = (left: string, right: string, width = 32) => {
  const spaceNeeded = width - left.length - right.length
  if (spaceNeeded > 0) {
    return left + ' '.repeat(spaceNeeded) + right
  }
  return left + ' ' + right
}

const getDynamicItemDetails = (
  name: string,
  harga_satuan: number,
  variant: string | undefined,
  ticketPackages: any[]
) => {
  // Find matched package in ticketPackages
  let matchedPkg = ticketPackages.find((p: any) => {
    const variantMatch = !variant || variant === '-' || p.variant === variant
    const nameMatch = p.name.toLowerCase() === name.toLowerCase()
    
    // Check if the nominal or displayNominal matches the unit price
    const priceMatch = Number(p.nominal) === harga_satuan || Number(p.displayNominal) === harga_satuan
    if (variantMatch && nameMatch && priceMatch) return true

    // Check override rules
    const ruleMatch = p.rules?.some((r: any) => 
      Number(r.overrideNominal) === harga_satuan || Number(r.overrideDisplayNominal) === harga_satuan
    )
    if (variantMatch && nameMatch && ruleMatch) return true

    return false
  })

  // Fallback match if name is not found (in case name changed but variant and price match)
  if (!matchedPkg) {
    matchedPkg = ticketPackages.find((p: any) => {
      const variantMatch = !variant || variant === '-' || p.variant === variant
      const priceMatch = Number(p.nominal) === harga_satuan || Number(p.displayNominal) === harga_satuan
      if (variantMatch && priceMatch) return true

      const ruleMatch = p.rules?.some((r: any) => 
        Number(r.overrideNominal) === harga_satuan || Number(r.overrideDisplayNominal) === harga_satuan
      )
      if (variantMatch && ruleMatch) return true

      return false
    })
  }

  // Get features
  let features: string[] = []
  if (matchedPkg && matchedPkg.features && matchedPkg.features.length > 0) {
    features = matchedPkg.features
  } else {
    // Fallback matching by price or product name keywords
    const nameLower = name.toLowerCase()
    if (harga_satuan === 55000 || nameLower.includes('all in')) {
      features = ['Immersive', 'Photobooth', 'Kids Zone', 'Nirwana Waterpark']
    } else if (harga_satuan === 45000 || nameLower.includes('ruarasa') || nameLower.includes('kid zone')) {
      features = ['Immersive', 'Photobooth', 'Kids Zone']
    } else if (harga_satuan === 40000 || nameLower.includes('nirwana')) {
      features = ['Immersive', 'Nirwana Waterpark']
    } else if (harga_satuan === 35000 || harga_satuan === 30000 || nameLower.includes('immersive')) {
      features = ['Immersive']
    } else if (variant === 'VOUCHER') {
      features = ['Immersive']
    }
  }

  // Get display name
  let displayName = name
  if (variant === 'VOUCHER') {
    displayName = 'Paket Immersive'
  } else if (variant === 'OUTING' || name.toLowerCase().includes('outing')) {
    displayName = 'Outing Class'
  } else if (matchedPkg) {
    displayName = matchedPkg.name
  } else if (harga_satuan === 55000 || name.toLowerCase().includes('all in')) {
    displayName = 'Paket All In'
  } else if (harga_satuan === 45000 || name.toLowerCase().includes('ruarasa')) {
    displayName = 'Paket Bundling Ruarasa'
  } else if (harga_satuan === 40000 || name.toLowerCase().includes('nirwana')) {
    displayName = 'Paket Bundling Nirwana'
  } else if (harga_satuan === 35000 || harga_satuan === 30000 || name.toLowerCase().includes('immersive')) {
    displayName = 'Paket Immersive'
  }

  return { displayName, features }
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ sales }) => {
  if (sales.length === 0) return null

  // Load ticket packages from localStorage
  const savedPackagesStr = typeof window !== 'undefined' ? localStorage.getItem('ticket_packages') : null
  const ticketPackages = savedPackagesStr ? JSON.parse(savedPackagesStr) : []

  const firstItem = sales[0]
  let printedSubtotal = 0
  let printedTotal = 0

  sales.forEach((item: any) => {
    const isVoucher = item.variant === 'VOUCHER'
    const originalUnitPrice = isVoucher ? 50000 : item.harga_satuan
    const originalItemTotal = originalUnitPrice * item.qty
    printedSubtotal += originalItemTotal
    printedTotal += item.total_harga
  })

  const printedDiscount = printedSubtotal - printedTotal
  const uniquePayments = Array.from(
    new Set(sales.map((item: any) => item.metode_pembayaran || 'CASH')),
  ).join(' / ')

  const itemDate = new Date(firstItem.tanggal)
  const dateStr = itemDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timeStr =
    itemDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WITA'

  const yyyy = itemDate.getFullYear()
  const mm = String(itemDate.getMonth() + 1).padStart(2, '0')
  const dd = String(itemDate.getDate()).padStart(2, '0')
  const seqStr = String(firstItem.daily_sequence || 1).padStart(3, '0')
  const invoiceNo = `INV/${yyyy}${mm}${dd}/${seqStr}`

  const divider = '-'.repeat(32)
  const doubleDivider = '='.repeat(32)
  const isSingleItem = sales.length === 1

  const receiptContent = (
    <div id='print-receipt-container'>
      <div className='receipt-page'>
        <div className='receipt-header' style={{ marginBottom: 0 }}>
          <pre
            style={{
              margin: 0,
              fontFamily: 'Courier New',
              fontWeight: 'bold',
            }}
          >
            {centerAlign('RUARASA LOMBOK IMMERSIVE EDUPARK')}
          </pre>
          <pre style={{ margin: 0, fontFamily: 'Courier New' }}>
            {doubleDivider}
          </pre>
        </div>

        <pre style={{ margin: 0, fontFamily: 'Courier New' }}>
          {`Tanggal : ${dateStr}
Waktu   : ${timeStr}
No.     : ${invoiceNo}
Kasir   : ${firstItem.kasir?.toUpperCase() || '-'}
Bayar   : ${uniquePayments.toUpperCase()}`}
        </pre>

        <pre style={{ margin: 0, fontFamily: 'Courier New' }}>{divider}</pre>

        {!isSingleItem && (
          <pre
            style={{
              margin: 0,
              fontFamily: 'Courier New',
              fontWeight: 'bold',
            }}
          >
            ITEMS:
          </pre>
        )}

        <div style={{ margin: isSingleItem ? 0 : '8px 0 0 0' }}>
          {sales.map((item: any, idx: number) => {
            const { displayName, features } = getDynamicItemDetails(
              item.nama_barang,
              item.harga_satuan,
              item.variant,
              ticketPackages
            )

            const indent = isSingleItem ? '' : '   '
            const isVoucher = item.variant === 'VOUCHER'
            const displayUnitPrice = isVoucher ? 50000 : item.harga_satuan
            const displayItemTotal = displayUnitPrice * item.qty

            const qtyStr = `${item.qty} x Rp ${displayUnitPrice.toLocaleString('id-ID')}`
            const totalStr = `Rp ${displayItemTotal.toLocaleString('id-ID')}`

            const nameLine = isSingleItem
              ? displayName
              : `${idx + 1}. ${displayName}`
            const priceLine = formatReceiptLine(
              `${indent}${qtyStr}`,
              totalStr,
              32,
            )
            const featureLines = features.length > 1
              ? features.map((feat) => `${indent}- ${feat}`).join('\n')
              : ''

            return (
              <div
                key={idx}
                style={{ marginBottom: idx === sales.length - 1 ? 0 : '8px' }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'Courier New',
                    fontWeight: 'bold',
                  }}
                >
                  {nameLine}
                </pre>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'Courier New',
                  }}
                >
                  {priceLine}
                  {featureLines ? '\n' + featureLines : ''}
                </pre>
              </div>
            )
          })}
        </div>

        <pre style={{ margin: 0, fontFamily: 'Courier New' }}>{divider}</pre>

        <pre style={{ margin: 0, fontFamily: 'Courier New' }}>
          {`${formatReceiptLine(
            'SUBTOTAL',
            `Rp ${printedSubtotal.toLocaleString('id-ID')}`,
            32,
          )}
${formatReceiptLine(
  'DISCOUNT',
  printedDiscount > 0 ? `-Rp ${printedDiscount.toLocaleString('id-ID')}` : '-',
  32,
)}`}
        </pre>

        <pre style={{ margin: 0, fontFamily: 'Courier New' }}>{divider}</pre>
        <pre
          style={{
            margin: 0,
            fontFamily: 'Courier New',
          }}
        >
          {formatReceiptLine(
            'TOTAL',
            `Rp ${printedTotal.toLocaleString('id-ID')}`,
            32,
          )}
        </pre>
        <pre style={{ margin: '8px 0 0 0', fontFamily: 'Courier New' }}>
          {doubleDivider}
        </pre>

        <div className='receipt-footer' style={{ marginTop: '8px' }}>
          <pre
            style={{
              margin: 0,
              fontFamily: 'Courier New',
              fontWeight: 'bold',
            }}
          >
            {centerAlign('TERIMA KASIH ATAS KUNJUNGAN ANDA', 32)}
          </pre>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(receiptContent, document.body)
  }
  return null
}
