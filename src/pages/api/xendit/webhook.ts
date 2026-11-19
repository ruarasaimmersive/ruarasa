import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const prerender = false

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || ''
// Using service role if available for webhook to bypass RLS, otherwise anon
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json()

    // Check for QRIS payment (event: qr.payment)
    // Structure: { event: 'qr.payment', status: 'COMPLETED', qr_code: { external_id: '...' } }
    if (payload.status === 'COMPLETED' || payload.event === 'qr.payment') {
      const external_id = payload.qr_code?.external_id || payload.data?.external_id || payload.external_id
      
      if (!external_id) {
        console.warn('Webhook received but no external_id found in payload', payload)
        return new Response('OK', { status: 200 })
      }

      console.log(`Payment completed for ${external_id}`)

      // Handle multi-row update based on external_id pattern
      // Pattern: PHONE_TIMESTAMP (e.g., 6281234567890_1679500000000)
      const [phone, timestampStr] = external_id.split('_')
      if (phone && timestampStr) {
        // Find bookings created by this phone around this timestamp
        const timestamp = new Date(parseInt(timestampStr))
        const startTime = new Date(timestamp.getTime() - 60000).toISOString() // 1 min before
        const endTime = new Date(timestamp.getTime() + 60000).toISOString() // 1 min after

        const { data: bookings, error: findError } = await supabase
          .from('online_bookings')
          .select('id, customer_name, product_name, qty, total_price')
          .eq('phone', phone)
          .gte('created_at', startTime)
          .lte('created_at', endTime)
          .eq('status', 'MENUNGGU_VERIFIKASI')

        if (findError) {
          console.error('Error finding bookings:', findError)
          return new Response('Database Error', { status: 500 })
        }

        if (bookings && bookings.length > 0) {
          // Update status to TERVERIFIKASI
          const { error: updateError } = await supabase
            .from('online_bookings')
            .update({ 
               status: 'TERVERIFIKASI', 
               verified_at: new Date().toISOString() 
            })
            .in('id', bookings.map(b => b.id))

          if (updateError) {
            console.error('Error updating status:', updateError)
          } else {
            console.log('Bookings updated to TERVERIFIKASI')
            // Option: Call WhatsApp Notification from here if needed
            const whatsappUrl = process.env.WA_WEBHOOK_URL || 'https://n8n.jadiind.com/webhook/notify/ruarasa'
            if (whatsappUrl) {
              const customerName = bookings[0].customer_name
              const totalItems = bookings.map(b => ({
                product: b.product_name,
                qty: b.qty,
                price: b.total_price / b.qty
              }))
              const totalAmount = bookings.reduce((sum, b) => sum + b.total_price, 0)

              await fetch(whatsappUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'VERIFIED',
                  customer: { name: customerName, phone: phone },
                  booking: {
                    id: bookings[0].id,
                    items: totalItems,
                    total: totalAmount,
                    date: new Date().toISOString(),
                    payment_method: 'QRIS (Xendit AUTO)'
                  },
                  timestamp: new Date().toISOString()
                })
              }).catch(e => console.error('WA Webhook Error:', e))
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
