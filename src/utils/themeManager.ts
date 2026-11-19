// Basic types for theme configuration
export interface Theme {
  slug: string // url friendly name (e.g., 'ramadhan')
  name: string // Display name
  description?: string
  colors: {
    primary: string // Main brand color (e.g., #10b981)
    secondary: string // Accent/Gold (e.g., #eab308)
    backgroundStart: string // Gradient start
    backgroundEnd: string // Gradient end
    textHighlight: string
  }
  assets: {
    heroImage?: string // If you want different hero images per event
    logoVariant?: string // If you have a Christmas logo, for example
    pattern?: string // CSS pattern class or image url
  }
}

// 1. DEFINISI TEMA (Warna, Nama, dll)
// Anda bisa menambahkan tema baru di sini untuk event mendatang
export const themes: Record<string, Theme> = {
  default: {
    slug: 'default',
    name: 'Rua Rasa Original',
    description: 'Tema default dengan hijau emerald dan nuansa budaya.',
    colors: {
      primary: '#10b981', // Emerald-500
      secondary: '#059669', // Emerald-600
      backgroundStart: '#18181b', // Zinc-900
      backgroundEnd: '#09090b', // Zinc-950
      textHighlight: '#34d399', // Emerald-400
    },
    assets: {
      pattern: 'pattern-cultural', // Defined in global.css
    },
  },
  ramadhan: {
    slug: 'ramadhan',
    name: 'Spesial Ramadhan',
    description: 'Nuansa hijau islami dan emas untuk bulan puasa/lebaran.',
    colors: {
      primary: '#059669', // Emerald-600 (Lebih Deep)
      secondary: '#fbbf24', // Amber-400 (Emas)
      backgroundStart: '#064e3b', // Emerald-900 (Gelap banget)
      backgroundEnd: '#022c22', // Emerald-950
      textHighlight: '#fcd34d', // Amber-300
    },
    assets: {
      pattern: 'pattern-ketupat', // Nanti tinggal bikin CSS class ini
    },
  },
  halloween: {
    slug: 'halloween',
    name: 'Spooky October',
    description: 'Tema ungu dan oranye untuk Halloween.',
    colors: {
      primary: '#a855f7', // Purple-500
      secondary: '#f97316', // Orange-500
      backgroundStart: '#2e1065', // Violet-950
      backgroundEnd: '#0f172a', // Slate-900
      textHighlight: '#fb923c', // Orange-400
    },
    assets: {
      pattern: 'pattern-cobweb',
    },
  },
}

// 2. JADWAL TEMA (Scheduler)
// Di sini Anda mengatur tanggal mulai dan selesai untuk setiap tema.
// Format tanggal: YYYY-MM-DD
export const themeSchedule = [
  // Contoh: Set tema Ramadhan dari 1 Maret 2024 s/d 10 April 2024
  {
    themeSlug: 'ramadhan',
    startDate: '2024-03-01',
    endDate: '2024-04-10',
  },
  // Contoh: Halloween (Oktober)
  {
    themeSlug: 'halloween',
    startDate: '2024-10-25',
    endDate: '2024-10-31',
  },
]

// Helper: Mendapatkan Tema Aktif Berdasarkan Tanggal Hari Ini
export function getCurrentTheme(): Theme {
  const today = new Date()

  // 1. Cek apakah hari ini masuk dalam jadwal event
  const activeEvent = themeSchedule.find((event) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    // Set jam ke 00:00:00 agar perbandingan tanggal akurat
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return today >= start && today <= end
  })

  // 2. Jika ada event aktif, kembalikan tema event tersebut
  if (activeEvent && themes[activeEvent.themeSlug]) {
    return themes[activeEvent.themeSlug]
  }

  // 3. Jika tidak ada, kembalikan tema default
  return themes.default
}
