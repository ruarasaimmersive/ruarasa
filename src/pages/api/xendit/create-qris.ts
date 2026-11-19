import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, external_id, customer_name } = await request.json()

    if (!amount || !external_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Use import.meta.env for Astro environment variables
    const secretKey =
      import.meta.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY
    console.log(secretKey)

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: 'Xendit Secret Key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64')

    // Tentukan URL publik aplikasi untuk webhook Xendit
    const publicOrigin =
      import.meta.env.APP_URL ||
      process.env.APP_URL ||
      'https://rekap.ruarasa.com'

    const response = await fetch('https://api.xendit.co/qr_codes', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id,
        type: 'DYNAMIC',
        callback_url: `${publicOrigin}/api/xendit/webhook`,
        amount,
        metadata: {
          customer_name,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Xendit Error:', data)
      return new Response(
        JSON.stringify({ error: data.message || 'Xendit API error' }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
