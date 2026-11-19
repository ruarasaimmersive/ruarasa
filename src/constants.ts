export const ALLOWED_CASHIERS = ['nida', 'fila', 'zakki']

// ⚠️  URL-URL berikut dipindahkan ke .env agar tidak terekspos ke browser:
// WA_WEBHOOK_URL       → dipakai di src/pages/api/notify.ts (server-side)
// GENERAL_SCRIPT_URL   → masih dipakai di komponen React (lihat catatan di bawah)
// SYNC_PRICE_SCRIPT_URL → saat ini tidak dipakai

// Google Apps Script URL — masih dipakai oleh Navigation.tsx & History.tsx (client)
// Catatan keamanan: URL ini bukan secret (hanya Google Script publik), namun
// idealnya juga dipindahkan ke API route jika ingin sepenuhnya disembunyikan.
export const GENERAL_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwWzK2V7fVgjpB0jwlMlJiUAfrxuqabZm4SYXY_vswvrbv_Fs_pbD_kNN-_2JZTpep0/exec'

// ============================================
// LANDING PAGE IMAGES
// ============================================

// Hero Section Images
export const HERO_IMAGES = {
  main: '/hero/front.jpg',
  secondary: '/hero/back.jpg',
}

export const QRIS_IMAGE = '/qris.jpg'

// Immersive Edupark Slideshow Images (rotates every 4 seconds)
export const IMMERSIVE_EDUPARK_IMAGES = [
  '/facilities/immersive-1.jpeg',
  '/facilities/immersive-2.jpeg',
  '/facilities/immersive-3.jpeg',
]

export const VALENTINE_IMAGES = [
  '/event/valentine-1.jpeg',
  '/event/valentine-2.jpeg',
  '/event/valentine-3.jpeg',
]

// Bento Grid Attraction Images
export const ATTRACTION_IMAGES = {
  // Kid Zone - Currently using gradient placeholder (no image needed)
  kidZone: '/facilities/kidzone.webp', // Set URL here when actual image is available

  // Photo Booth
  photoBooth: '/facilities/booth.webp',

  // Hot Air Balloon
  pepadu: '/facilities/pepadu.jpeg',

  // Coming Soon Teaser
  comingSoon: '/facilities/garden.jpg',
}

// About Section Images
export const ABOUT_IMAGES = {
  study: '/facilities/study.jpg',
  history: '/history.webp',
  fluid_valentine: '/event/fluid.webp',
  card_valentine: '/event/card.jpg',
}

// ============================================
// LOCATION / VENUE
// ============================================

export const LOCATION = {
  name: 'Gedung Ruarasa',
  address:
    'Jl. Jend. Sudirman, Rembiga, Kec. Selaparang, Kota Mataram, Nusa Tenggara Bar. 83239',
  coordinates: {
    lat: -8.565619195254767,
    lng: 116.1234396896124,
  },
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d986.3286159519521!2d116.1231071!3d-8.5657306!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dcdc100006dc403%3A0xe1e6a09d19ccb55f!2sGedung%20Ruarasa!5e0!3m2!1sen!2sid!4v1770526685132!5m2!1sen!2sid',
  mapsUrl: 'https://maps.app.goo.gl/8V4DjspFdJQNoquz9',
  operatingHours: 'Selasa - Jumat: 09:00 - 17:00 WITA, Sabtu - Minggu: 09:00 - 19:00 WITA,Senin: Libur',
  email: 'ruarasaimmersive@gmail.com',
  whatsapp: ['087835297789'],
}

// ============================================
// FAQ DATA
// ============================================

export const FAQ_DATA = [
  {
    question: 'Apa itu Rua Rasa Immersive Edupark?',
    answer:
      'Rua Rasa adalah destinasi wisata edukasi dan hiburan pertama di Lombok! Di sini, kamu bisa menikmati pengalaman imersif yang menggabungkan seni cahaya, teknologi proyeksi interaktif, dan cerita sejarah budaya Sasak. Seru banget!',
  },
  {
    question: 'Berapa harga tiket masuknya?',
    answer:
      'Saat ini kami menyediakan beberapa pilihan tiket: Tiket Immersive seharga Rp 35.000 (akses area imersif), Tiket Bundling Nirwana seharga Rp 40.000 (akses Immersive + Tiket Berenang Nirwana Waterpark), Tiket Bundling Ruarasa seharga Rp 45.000 (Immersive + Kid Zone + Photobooth), dan Tiket All In seharga Rp 55.000 (paket lengkap semua wahana).',
  },
  {
    question: 'Apakah anak-anak perlu bayar tiket?',
    answer:
      'Untuk area Immersive, anak di bawah 3 tahun GRATIS! Untuk Kid Zone, semua anak perlu membeli tiket agar bisa bermain.',
  },

  {
    question: 'Apakah tempat ini ramah untuk anak-anak?',
    answer:
      'Pastinya! Kami punya Kid Zone khusus dengan permainan edukatif yang aman dan seru. Area Immersive juga cocok untuk semua usia, dari balita sampai dewasa bisa menikmati!',
  },
  {
    question: 'Berapa lama waktu yang dibutuhkan untuk berkeliling?',
    answer:
      'Biasanya pengunjung menghabiskan sekitar 60-90 menit untuk menikmati semua wahana, foto-foto, dan santai sambil ngopi. Tapi boleh kok lebih lama!',
  },
  {
    question: 'Kalau sudah beli tiket, bisa di-refund tidak?',
    answer:
      'Maaf ya, tiket yang sudah dibeli tidak bisa di-refund. Tapi tenang, kamu bisa reschedule ke tanggal lain selama bukan tiket event khusus. Hubungi admin kami untuk bantuan!',
  },
  {
    question: 'Apakah tersedia parkir di lokasi?',
    answer:
      'Tentu! Kami menyediakan area parkir yang luas untuk motor, mobil, dan bus. Jadi nggak perlu khawatir soal parkir ya!',
  },
  {
    question: 'Boleh bawa makanan atau minuman dari luar?',
    answer:
      'Demi kenyamanan dan kebersihan bersama, makanan dan minuman dari luar tidak diperbolehkan ya. Tapi tenang, kami punya Coffee Shop dengan berbagai pilihan makanan dan minuman enak yang bisa kamu nikmati!',
  },
  {
    question: 'Apakah ada tempat ibadah untuk Muslim?',
    answer:
      'Ada dong! Kami menyediakan mushola di area belakang yang merupakan replika Masjid Kuno Bayan Beleq. Jadi kamu tetap bisa beribadah dengan nyaman sambil menikmati nuansa sejarah.',
  },
  {
    question: 'Apakah tersedia toilet di lokasi?',
    answer:
      'Pasti ada dong! Kami menyediakan toilet di 3 lokasi: 2 di Pos Satpam, 2 di area Kafe, dan 2 lagi di area belakang samping Musholla. Bersih dan nyaman pastinya!',
  },
]

// ============================================
// TICKET INFO (Landing Page - Pricing Section)
// ============================================

// --- Versi Normal (tanpa event) ---
export const TICKET_INFO_DEFAULT = {
  label: 'TIKET MASUK',
  price: 50,
  priceUnit: 'rb',
  badge: '✨ Termasuk Voucher',
  voucherDescription: 'Dapatkan Voucher Senilai',
  voucherAmount: '15 Ribu/Pax',
  voucherSuffix: 'yang bisa ditukarkan untuk menikmati:',
  voucherPerks: [
    { icon: '☕', label: 'Coffee Shop (F&B)' },
    { icon: '🛝', label: 'Kid Zone (Playground)' },
    { icon: '📸', label: 'Photo Booth' },
  ],
  ctaLabel: 'Pesan Tiket',
  ctaHref: '/ticket',
}

export const TICKET_INFO_EVENT = [
  {
    label: 'TIKET IMMERSIVE',
    price: 35,
    priceUnit: 'rb',
    badge: '',
    voucherDescription: 'Sudah termasuk akses wahana:',
    voucherAmount: '',
    voucherSuffix: '',
    voucherPerks: [{ icon: '✨', label: 'Akses Immersive' }],
    ctaLabel: 'Pesan Tiket Sekarang →',
    ctaHref: '/ticket',
  },
  {
    label: 'BUNDLING NIRWANA',
    price: 40,
    priceUnit: 'rb',
    badge: '🏊 Berenang',
    voucherDescription: 'Sudah termasuk paket wahana:',
    voucherAmount: '',
    voucherSuffix: '',
    voucherPerks: [
      { icon: '✨', label: 'Akses Immersive' },
      { icon: '🏊', label: 'Voucher Berenang Nirwana Waterpark' },
    ],
    ctaLabel: 'Pesan Tiket Sekarang →',
    ctaHref: '/ticket',
  },
  {
    label: 'BUNDLING RUARASA',
    price: 45,
    priceUnit: 'rb',
    badge: '🎈 Kid Zone + Photobooth',
    voucherDescription: 'Sudah termasuk paket wahana:',
    voucherAmount: '',
    voucherSuffix: '',
    voucherPerks: [
      { icon: '✨', label: 'Akses Immersive' },
      { icon: '📸', label: 'Photobooth' },
      { icon: '🎈', label: 'Kid Zone' },
    ],
    ctaLabel: 'Pesan Tiket Sekarang →',
    ctaHref: '/ticket',
  },
  {
    label: 'TIKET ALL IN',
    price: 55,
    priceUnit: 'rb',
    badge: '🔥 Paket Complete',
    voucherDescription: 'Sudah termasuk paket lengkap:',
    voucherAmount: '',
    voucherSuffix: '',
    voucherPerks: [
      { icon: '✨', label: 'Akses Immersive' },
      { icon: '📸', label: 'Photobooth' },
      { icon: '🎈', label: 'Kid Zone' },
      { icon: '🏊', label: 'Voucher Berenang Nirwana Waterpark' },
    ],
    ctaLabel: 'Pesan Tiket Sekarang →',
    ctaHref: '/ticket',
  },

]

// ============================================
// 🔀 AKTIF SEKARANG — ganti di sini saat event mulai/berakhir
// ============================================
export const TICKET_INFO = TICKET_INFO_EVENT

export const VALENTINE_FAQ_DATA = [
  FAQ_DATA[0], // Apa itu
  {
    question: 'Apakah tiket Valentine bisa di-refund atau diganti paketnya?',
    answer:
      'Mohon maaf, tiket event Valentine tidak bisa di-refund. Kamu bisa upgrade ke paket yang lebih mahal (cukup bayar selisihnya), namun tidak bisa downgrade ke paket yang lebih murah. Hubungi admin kami untuk bantuan upgrade!',
  },
  FAQ_DATA[5], // Refund
  FAQ_DATA[6], // Parkir
  FAQ_DATA[7], // Makanan
]

// ============================================
// DYNAMIC TICKET PACKAGES (DEFAULT STATE)
// ============================================

export const DEFAULT_PACKAGE_GROUPS: any[] = [
  { id: 'g_reguler', name: 'Reguler', defaultVariant: 'REGULER' },
  { id: 'g_outing', name: 'Outing', defaultVariant: 'OUTING' },
  { id: 'g_voucher', name: 'Voucher', defaultVariant: 'VOUCHER' },

]

export const DEFAULT_TICKET_PACKAGES: any[] = [
  {
    id: 'p_reg_35',
    groupId: 'g_reguler',
    name: 'Paket Immersive',
    variant: 'REGULER',
    nominal: 35000,
    displayNominal: 35000,
    rules: [],
    features: ['Immersive'],
  },
  {
    id: 'p_reg_40',
    groupId: 'g_reguler',
    name: 'Paket Bundling Nirwana',
    variant: 'REGULER',
    nominal: 40000,
    displayNominal: 40000,
    rules: [],
    features: ['Immersive', 'Nirwana Waterpark'],
  },
  {
    id: 'p_reg_45',
    groupId: 'g_reguler',
    name: 'Paket Bundling Ruarasa',
    variant: 'REGULER',
    nominal: 45000,
    displayNominal: 45000,
    rules: [],
    features: ['Immersive', 'Photobooth', 'Kids Zone'],
  },
  {
    id: 'p_reg_55',
    groupId: 'g_reguler',
    name: 'Paket All In',
    variant: 'REGULER',
    nominal: 55000,
    displayNominal: 55000,
    rules: [],
    features: ['Immersive', 'Photobooth', 'Kids Zone', 'Nirwana Waterpark'],
  },
  {
    id: 'p_outing_25',
    groupId: 'g_outing',
    name: 'Outing',
    variant: 'OUTING',
    nominal: 25000,
    displayNominal: 25000,
    rules: [],
    features: ['Immersive'],
  },
  {
    id: 'p_outing_35',
    groupId: 'g_outing',
    name: 'Outing',
    variant: 'OUTING',
    nominal: 35000,
    displayNominal: 35000,
    rules: [],
    features: ['Immersive'],
  },
  {
    id: 'p_voucher_free',
    groupId: 'g_voucher',
    name: 'Gratis Immersive',
    variant: 'VOUCHER',
    nominal: 0,
    displayNominal: 0,
    rules: [],
    features: ['Immersive'],
  },
  {
    id: 'p_voucher_50',
    groupId: 'g_voucher',
    name: 'Diskon 50%',
    variant: 'VOUCHER',
    nominal: 25000,
    displayNominal: 25000,
    rules: [],
    features: ['Immersive'],
  },
  {
    id: 'p_voucher_b1g1',
    groupId: 'g_voucher',
    name: 'Beli 1 Gratis 1',
    variant: 'VOUCHER',
    nominal: 50000,
    displayNominal: 50000,
    rules: [
      {
        id: 'r_voucher_b1g1',
        overrideNominal: 50000,
        overrideDisplayNominal: 50000,
        multipleOf: 2,
        multiplePrice: 50000,
        multipleDisplayPrice: 50000,
      },
    ],
    features: ['Immersive'],
  },
  {
    id: 'p_voucher_b1g1_50',
    groupId: 'g_voucher',
    name: 'B1G1 + Diskon 50%',
    variant: 'VOUCHER',
    nominal: 25000,
    displayNominal: 25000,
    rules: [
      {
        id: 'r_voucher_b1g1_50',
        overrideNominal: 25000,
        overrideDisplayNominal: 25000,
        multipleOf: 2,
        multiplePrice: 25000,
        multipleDisplayPrice: 25000,
      },
    ],
    features: ['Immersive'],
  },

  {
    id: 'p_event_bundling_immersive',
    groupId: 'g_event',
    name: 'Bundling Immersive',
    variant: 'EVENT',
    nominal: 35000,
    displayNominal: 35000,
    rules: [],
    features: ['Event', 'Immersive'],
  },
]

// ============================================
// PROMO CAROUSEL DATA
// ============================================

export const PROMO_CAROUSEL_DATA = [
  {
    isActive: true,
    images: ['/bundling-1.jpeg', '/bundling-2.jpeg'],
    altText: 'Paket Tiket Bundling Ruarasa',
    descriptionHtml:
      '✨ <span class="font-black text-zinc-900">Wahana Lengkap Dalam 1 Tiket!</span> ✨<br/>Nikmati <span class="font-bold text-sky-600">Area Immersive</span>, <span class="font-bold text-sky-600">Kid Zone</span>, <span class="font-bold text-sky-600">Photobooth</span>, & <span class="font-bold text-sky-600">Voucher Berenang</span> Nirwana Waterpark!',
    ctaText: 'Pesan Tiket Sekarang 🎟️',
    ctaLink: '#ticket',
  },

]
