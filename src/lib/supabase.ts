import { createClient } from '@supabase/supabase-js'

// Di mode 'server', import.meta.env hanya tersedia saat build.
// Gunakan process.env sebagai fallback untuk runtime (Docker).

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_URL : '') ||
  ''

const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_ANON_KEY : '') ||
  ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for online bookings
export type OnlineBooking = {
  id?: number
  created_at?: string
  updated_at?: string
  customer_name: string
  phone: string
  product_name: string
  qty: number
  unit_price: number
  total_price: number
  payment_method: 'ONSITE' | 'TRANSFER'
  payment_proof_url?: string | null
  status:
    | 'BOOKING'
    | 'MENUNGGU_VERIFIKASI'
    | 'TERVERIFIKASI'
    | 'SELESAI'
    | 'DIBATALKAN'
  verified_by?: string | null
  verified_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
}

// Insert a new online booking
export const createOnlineBooking = async (
  booking: Omit<OnlineBooking, 'id' | 'created_at'>,
) => {
  const { data, error } = await supabase
    .from('online_bookings')
    .insert([booking])
    .select()
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw error
  }

  return data
}

// Get all online bookings (for admin)
export const getOnlineBookings = async () => {
  const { data, error } = await supabase
    .from('online_bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    throw error
  }

  return data
}

// Update booking status with tracking
export const updateBookingStatus = async (
  id: number,
  status: OnlineBooking['status'],
  options?: {
    verified_by?: string
    cancel_reason?: string
  },
) => {
  const updatePayload: Partial<OnlineBooking> = { status }

  // Add timestamp based on status change
  const now = new Date().toISOString()

  if (status === 'TERVERIFIKASI') {
    updatePayload.verified_at = now
    updatePayload.verified_by = options?.verified_by || null
  } else if (status === 'SELESAI') {
    updatePayload.completed_at = now
  } else if (status === 'DIBATALKAN') {
    updatePayload.cancelled_at = now
    updatePayload.cancel_reason = options?.cancel_reason || null
  }

  const { data, error } = await supabase
    .from('online_bookings')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating booking:', error)
    throw error
  }

  return data
}

// Get bookings by status (for admin filtering)
export const getBookingsByStatus = async (status: OnlineBooking['status']) => {
  const { data, error } = await supabase
    .from('online_bookings')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    throw error
  }

  return data
}

// Get today's bookings
export const getTodayBookings = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('online_bookings')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching today bookings:', error)
    throw error
  }

  return data
}

export type SupabaseTicketPackage = {
  id: string
  group_id: string
  group_name: string
  name: string
  variant: 'REGULER' | 'PELAJAR' | 'EVENT' | 'OUTING' | 'VOUCHER'
  nominal: number
  display_nominal: number
  rules: any[]
  features: string[]
  sort_order?: number
  is_active?: boolean
}

export const getTicketPackagesFromDB = async () => {
  const { data, error } = await supabase
    .from('ticket_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching ticket packages:', error)
    throw error
  }
  return data as SupabaseTicketPackage[]
}

export const upsertTicketPackage = async (pkg: SupabaseTicketPackage) => {
  const { data, error } = await supabase
    .from('ticket_packages')
    .upsert([{ ...pkg, updated_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) {
    console.error('Error saving ticket package:', error)
    throw error
  }
  return data
}

export const deleteTicketPackageFromDB = async (id: string) => {
  const { error } = await supabase
    .from('ticket_packages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ticket package:', error)
    throw error
  }
}

// ==========================================
// SALES / REKAP TRANSAKSI KASIR (SUPABASE)
// ==========================================

export type SupabaseSale = {
  transaction_id: string
  order_id: number
  tanggal: string
  nama_barang: string
  qty: number
  harga_satuan: number
  total_harga: number
  display_total?: number
  metode_pembayaran?: string
  nomor_hp?: string
  customer_name?: string
  kasir?: string
  is_deleted?: boolean
  source?: string
  type?: string
  notes?: string
  variant?: string
  booking_id?: number | null
}

export const upsertSalesToDB = async (items: SupabaseSale[]) => {
  if (!items || items.length === 0) return []

  const payload = items.map((t) => ({
    transaction_id: t.transaction_id,
    order_id: Number(t.order_id) || 0,
    tanggal: t.tanggal,
    nama_barang: t.nama_barang,
    qty: Number(t.qty) || 1,
    harga_satuan: Number(t.harga_satuan) || 0,
    total_harga: Number(t.total_harga) || 0,
    display_total: Number(t.display_total ?? t.total_harga) || 0,
    metode_pembayaran: t.metode_pembayaran || 'CASH',
    nomor_hp: t.nomor_hp || '-',
    customer_name: t.customer_name || '',
    kasir: t.kasir || '',
    is_deleted: Boolean(t.is_deleted),
    source: t.source || 'UMUM',
    type: t.type || 'IN',
    notes: t.notes || '',
    variant: t.variant || '-',
    booking_id: t.booking_id ?? null,
  }))

  const { data, error } = await supabase
    .from('sales')
    .upsert(payload, { onConflict: 'transaction_id' })
    .select()

  if (error) {
    console.error('[Supabase] Error upserting sales:', error)
    throw error
  }
  return data || []
}

export const getSalesFromDB = async (limit = 300) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('tanggal', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Supabase] Error fetching sales:', error)
    throw error
  }
  return (data || []) as SupabaseSale[]
}