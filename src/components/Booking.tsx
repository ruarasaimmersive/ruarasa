import React, { useState, useEffect, useRef } from 'react'
import { initDB, type ProductDoc } from '../db'
import { createOnlineBooking, getTicketPackagesFromDB } from '../lib/supabase'
import { sendWhatsAppNotification } from '../lib/whatsapp'

import { Toast } from './ticket/Toast'
import { ConfirmModal } from './ticket/ConfirmModal'
import { QrisModal } from './ticket/QrisModal'
import { ProductSelect } from './ticket/ProductSelect'
import { CustomerDataForm } from './ticket/CustomerDataForm'
import { PaymentMethodSelect } from './ticket/PaymentMethodSelect'
import { BookingSummary } from './ticket/BookingSummary'
import { BookingHeader } from './ticket/BookingHeader'

const isDiscountActive = () => {
  const today = new Date()
  const endDiscountDate = new Date('2026-05-07T23:59:59+08:00') // Valid until end of May 7th WITA
  return today <= endDiscountDate
}

const getPackageEmoji = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('nirwana')) return '🏊'
  if (lower.includes('all in')) return '🔥'
  if (lower.includes('bundling')) return '🎈'
  if (lower.includes('kid')) return '🛝'
  if (lower.includes('photo')) return '📸'
  return '✨'
}

const Booking = () => {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [paymentMethod, setPaymentMethod] = useState<'ONSITE' | 'TRANSFER'>('TRANSFER')
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showQrisModal, setShowQrisModal] = useState(false)
  const [generatedQris, setGeneratedQris] = useState<string | null>(null)
  const [isGeneratingQris, setIsGeneratingQris] = useState(false)
  const [externalId, setExternalId] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      const db = await initDB()
      const docs = await db.products.find().exec()
      const localProducts: ProductDoc[] = docs.map((d: any) => d.toJSON())

      try {
        const dbPackages = await getTicketPackagesFromDB()
        const regulerPackages = (dbPackages || []).filter(
          (pkg) => pkg.group_id === 'g_reguler' || pkg.variant === 'REGULER',
        )

        if (regulerPackages.length > 0) {
          const supabaseTicketItems = regulerPackages.map((pkg) => {
            const matchedLocal = localProducts.find(
              (lp) => lp.name.toLowerCase() === pkg.name.toLowerCase(),
            )
            return {
              ...(matchedLocal || {}),
              id: pkg.id,
              name: pkg.name,
              price: Number(pkg.nominal),
              emoji: matchedLocal?.emoji || getPackageEmoji(pkg.name),
            }
          })

          const nonRegulerLocal = localProducts.filter(
            (lp) =>
              !lp.name.toLowerCase().includes('immersive') &&
              !lp.name.toLowerCase().includes('bundling') &&
              !lp.name.toLowerCase().includes('all in') &&
              !lp.name.toLowerCase().includes('sekar geni'),
          )

          setProducts([...supabaseTicketItems, ...nonRegulerLocal])
          return
        }
      } catch (err) {
        console.warn('[Booking] Gagal memuat harga dari Supabase, memakai fallback lokal:', err)
      }

      setProducts(localProducts)
    }

    loadProducts()
  }, [])

  const updateQty = (productName: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productName] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [productName]: next }
    })
  }

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = products.reduce((acc, p) => {
    const qty = cart[p.name] || 0
    if (qty === 0) return acc

    if (p.name === 'Tiket Bundling' && isDiscountActive()) {
      const pairs = Math.floor(qty / 2)
      const single = qty % 2
      return acc + pairs * 90000 + single * 50000
    }

    return acc + p.price * qty
  }, 0)

  const platformFee =
    paymentMethod === 'TRANSFER'
      ? (() => {
          const immersiveQty = Object.entries(cart)
            .filter(
              ([name]) =>
                name.includes('Immersive') ||
                name.includes('Bundling') ||
                name.includes('All In'),
            )
            .reduce((sum, [_, qty]) => sum + qty, 0)
          return immersiveQty * 2500
        })()
      : 0

  const getFullPhone = () => {
    return `62${phone.replace(/\D/g, '')}`
  }

  const showErrorToast = (message: string) => {
    setToastType('error')
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const showSuccessToast = (message: string) => {
    setToastType('success')
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totalItems === 0) {
      showErrorToast('Pilih tiket dulu sebelum booking ya!')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)

    try {
      const fullPhone = getFullPhone()
      const timestamp = Date.now()
      const newExternalId = `${fullPhone}_${timestamp}`
      setExternalId(newExternalId)

      const finalPrice = totalPrice + platformFee

      if (paymentMethod === 'TRANSFER') {
        setIsGeneratingQris(true)
        try {
          const qrisResp = await fetch('/api/xendit/create-qris', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalPrice,
              external_id: newExternalId,
              customer_name: customerName.trim(),
            }),
          })
          const qrisData = await qrisResp.json()
          if (!qrisResp.ok)
            throw new Error(qrisData.error || 'Gagal generate QRIS')

          setGeneratedQris(qrisData.qr_string)
          setShowQrisModal(true)
        } catch (err: any) {
          showErrorToast(err.message)
          setIsSubmitting(false)
          setIsGeneratingQris(false)
          return
        }
      }

      const status =
        paymentMethod === 'TRANSFER' ? 'MENUNGGU_VERIFIKASI' : 'BOOKING'

      const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0)

      const promises = cartEntries.map(async ([name, qty], index) => {
        const product = products.find((p) => p.name === name)
        if (!product) return

        let productTotal = product.price * qty
        let unitPrice = product.price

        if (name === 'Tiket Bundling' && isDiscountActive()) {
          const pairs = Math.floor(qty / 2)
          const single = qty % 2
          productTotal = pairs * 90000 + single * 50000
          unitPrice = Math.round(productTotal / qty)
        }

        if (paymentMethod === 'TRANSFER' && platformFee > 0 && index === 0) {
          productTotal += platformFee
        }

        return await createOnlineBooking({
          customer_name: customerName.trim(),
          phone: fullPhone,
          product_name: name,
          qty: qty,
          unit_price: unitPrice,
          total_price: productTotal,
          payment_method: paymentMethod,
          payment_proof_url:
            paymentMethod === 'TRANSFER' ? `XENDIT:${newExternalId}` : null,
          status: status,
        })
      })

      const bookingResults = await Promise.all(promises)
      const validBookings = bookingResults.filter((b) => b !== undefined)

      if (validBookings.length > 0) {
        const firstBooking = validBookings[0]
        const items = validBookings.map((b) => ({
          product: b!.product_name,
          qty: b!.qty,
          price: b!.unit_price,
        }))
        const total = validBookings.reduce((sum, b) => sum + b!.total_price, 0)

        await sendWhatsAppNotification({
          type: paymentMethod === 'TRANSFER' ? 'PAY_TRANSFER' : 'PAY_ONSITE',
          customer: {
            name: customerName,
            phone: fullPhone,
          },
          booking: {
            id: firstBooking!.id || '0',
            items: items,
            total: total,
            date: new Date().toISOString(),
            payment_method:
              paymentMethod === 'TRANSFER' ? 'QRIS (Xendit)' : 'BAYAR_DI_KASIR',
          },
        })
      }

      if (paymentMethod === 'ONSITE') {
        setCart({})
        setCustomerName('')
        setPhone('')
        setPaymentProof(null)
        showSuccessToast('Booking berhasil! Bayar di kasir saat datang ya.')
      } else {
        showSuccessToast('QRIS sudah muncul! Silakan bayar.')
      }
    } catch (err) {
      console.error(err)
      showErrorToast('Waduh, ada masalah. Coba lagi ya!')
    } finally {
      setIsSubmitting(false)
      setIsGeneratingQris(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className='flex justify-center items-center bg-zinc-50 min-h-screen'>
        <div className='border-4 border-sky-500 border-t-transparent rounded-full w-12 h-12 animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='bg-zinc-50 min-h-screen font-sans text-zinc-900'>
      <Toast show={showToast} type={toastType} message={toastMessage} />

      <ConfirmModal
        show={showConfirmModal}
        phone={phone}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedSubmit}
      />

      <QrisModal
        show={showQrisModal}
        generatedQris={generatedQris}
        totalPrice={
          totalPrice + (paymentMethod === 'TRANSFER' ? 2500 * totalItems : 0)
        }
        onClose={() => {
          setShowQrisModal(false)
          setCart({})
          setCustomerName('')
          setPhone('')
          window.location.href = '/'
        }}
      />

      <div className='mx-auto max-w-lg'>
        <div className='relative bg-white shadow-xl min-h-screen'>
          <BookingHeader />

          <form onSubmit={handleSubmit} className='flex flex-col h-full'>
            <div className='flex-1 p-4 pb-6'>
              <ProductSelect
                products={products}
                cart={cart}
                onUpdateQty={updateQty}
              />

              <CustomerDataForm
                customerName={customerName}
                phone={phone}
                onNameChange={setCustomerName}
                onPhoneChange={setPhone}
              />

              <PaymentMethodSelect />
            </div>

            <BookingSummary
              totalItems={totalItems}
              totalPrice={totalPrice}
              platformFee={platformFee}
              isSubmitting={isSubmitting}
              paymentMethod={paymentMethod}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default Booking