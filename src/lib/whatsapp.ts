// whatsapp.ts
// Helper client-side yang memanggil /api/notify (server-side proxy)
// WA_WEBHOOK_URL tidak pernah terekspos ke browser melalui file ini

export type WhatsAppNotifType =
  | 'BOOKING_CREATED' // 1. Booking Masuk (Generic / Admin?)
  | 'PAY_ONSITE'      // 2. Booking Onsite (Bayar di TKP)
  | 'PAY_TRANSFER'    // 3. Konfirmasi Pembayaran (Belum Verifikasi)
  | 'VERIFIED'        // 4. Admin Verifikasi (Siap Datang)
  | 'COMPLETED'       // 5. Customer Datang (Selesai)
  | 'EVENT_PURCHASE'  // 6. Khusus Event - Notif Admin Only

export interface WhatsAppPayload {
  type: WhatsAppNotifType
  customer: {
    name: string
    phone: string
  }
  booking: {
    id: number | string
    items: {
      product: string
      qty: number
      price: number
    }[]
    total: number
    date: string
    payment_method: string
  }
}

/**
 * Kirim notifikasi WhatsApp via server-side proxy (/api/notify).
 * URL webhook N8N tidak pernah muncul di bundle browser.
 */
export const sendWhatsAppNotification = async (payload: WhatsAppPayload) => {
  try {
    console.log('[WhatsApp] Sending notification via server proxy:', payload.type)

    // Hanya panggil API route internal kita — bukan langsung ke N8N
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('[WhatsApp] Error sending notification:', error)
  }
}
