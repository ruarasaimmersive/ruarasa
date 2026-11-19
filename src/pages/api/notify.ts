import type { APIRoute } from 'astro'

export const prerender = false

// Tipe payload dikirim dari client
export interface WhatsAppPayload {
  type: string
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: WhatsAppPayload = await request.json()

    // URL webhook N8N hanya ada di sini (server-side), tidak pernah terkirim ke browser
    const webhookUrl =
      import.meta.env.WA_WEBHOOK_URL ||
      process.env.WA_WEBHOOK_URL ||
      'https://n8n.jadiind.com/webhook/notify/ruarasa'

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'Webhook URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Normalisasi nomor telepon
    let phone = payload.customer.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)

    const body = {
      ...payload,
      customer: { ...payload.customer, phone },
      timestamp: new Date().toISOString(),
    }

    console.log('[WhatsApp API] Sending notification:', payload.type)

    // Kirim ke N8N dari server, bukan dari browser
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    return new Response(JSON.stringify({ success: true, status: resp.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[WhatsApp API] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
