export const LACX_DATA = {
  hero: {
    title: 'Lombok Art & Culture Experience',
    subtitle: 'LACX',
    tagline:
      'Bukan sekadar menonton — rasakan, pelajari, dan kuasai seni budaya Sasak bersama para maestro tradisi Lombok.',
    image: '/lacx/hero.jpg', // Placeholder, adjust as needed
  },
  about: {
    title: 'Apa itu LACX?',
    description:
      'Lombok Art and Culture Experience (LACX) merupakan salah satu program unggulan dari Rua Rasa Immersive Edupark dengan muatan seni dan kebudayaan Sasak berbasis Entertainment, Education dan Culture Tourism.',
    highlights: [
      'Instruktur Profesional Lokal & Internasional',
      'Fasilitas Lengkap di Ruarasa',
      'Silabus & Modul Terstruktur',
      'Tersertifikasi (Master Class)',
    ],
  },
  classes: [
    {
      id: 'short',
      name: 'Short Class',
      duration: '2 Jam – 3 Bulan',
      description:
        'Cocok untuk wisatawan dan pengunjung yang ingin merasakan pengalaman nyata seni budaya Sasak dalam waktu singkat.',
      certificate: 'Sertifikat Partisipasi',
      color: 'bg-orange-50',
      accent: 'text-orange-600',
    },
    {
      id: 'middle',
      name: 'Middle Class',
      duration: '3 – 6 Bulan',
      description:
        'Dirancang untuk mereka yang ingin mendalami satu tema seni budaya secara lebih serius dan mendapatkan ilmu dasar yang cukup.',
      certificate: 'Sertifikat Kompetensi Dasar',
      color: 'bg-amber-50',
      accent: 'text-amber-600',
    },
    {
      id: 'master',
      name: 'Master Class',
      duration: '6 Bulan – 1 Tahun',
      description:
        'Program paling komprehensif — menjadikan peserta sebagai praktisi profesional seni budaya Sasak.',
      certificate: 'Sertifikat Profesional Internasional',
      color: 'bg-zinc-900',
      accent: 'text-amber-400',
      dark: true,
    },
  ],
  categories: [
    {
      id: 'metallurgy',
      title: 'Sasak Metallurgy',
      subtitle: 'Seni Kriya Logam Sasak',
      description:
        'Seluruh hal yang berkaitan dengan budaya seni kriya logam Sasak seperti Keris, Gong, Pemaja, Terompong, Jungkat, Teken, dll.',
      price: 'Rp 8.000.000,-',
      priceType: 'Group',
      image: '/lacx/metalurgi.jpg',
    },
    {
      id: 'ethnopharmacology',
      title: 'Sasak Etnofarmakologi',
      subtitle: 'Herbal & Kesehatan Tradisional',
      description:
        'Mempelajari dunia herbal dan kesehatan dalam tradisi Sasak: Serbat, Mamak lekoq buaq, Jamu Fermentasi.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/herbal.jpg',
    },
    {
      id: 'cooking',
      title: 'Sasak Cooking Class',
      subtitle: 'Seni Kuliner Tradisional',
      description:
        'Dunia penciptaan seni kuliner tradisi Sasak: Ares, Pelecing, Bebalung, Tuak manis, Sari muka, dll.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/cooking.jpg',
    },
    {
      id: 'performing',
      title: 'Sasak Performing Art',
      subtitle: 'Seni Pertunjukan Sasak',
      description:
        'Seni tari, seni musik maupun seni teater: Ciloqaq, Gandrung, Cepung, Kelentang, Cupak Gerantang, dll.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/performing.jpg',
    },
    {
      id: 'fine-art',
      title: 'Sasak Fine Art',
      subtitle: 'Seni Rupa Tradisional',
      description:
        'Seni rupa Sasak baik murni maupun kriya: Tetapel, Cukli, Tatah wayang, Tatah kayu, sesekan.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/fineart.jpg',
    },
    {
      id: 'literary',
      title: 'Sasak Literary Art',
      subtitle: 'Seni Sastra Sasak',
      description:
        'Karya sastra tulis (Jejawan & Pegon) maupun lisan: Babad, Bewaran, Hikayat, Lelakaq, Carangan, Serat.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/literary.jpg',
    },
    {
      id: 'martial',
      title: 'Sasak Martial Art',
      subtitle: 'Seni Bela Diri Sasak',
      description:
        'Seni beladiri Sasak menggunakan senjata maupun tangan kosong: Perisean, Pencak Sasak, Pencak Rudat.',
      price: '$12',
      priceType: '/Pax',
      minQty: 'Minimal 5 orang',
      image: '/lacx/martial.jpg',
    },
  ],
  instructors: {
    title: 'Siapa Instrukturnya?',
    description:
      'Program LACX dijalankan oleh tim seniman tradisi Sasak yang tidak hanya berpengalaman, tetapi juga terukur secara akademis:',
    points: [
      'Seniman tradisi Sasak berpengalaman & profesional',
      'Instruktur lokal, nasional, dan internasional',
      'Sarjana dan Master Seni lulusan kampus seni terbaik di Indonesia',
    ],
  },
  brochure: {
    title: 'Unduh Panduan Lengkap',
    description:
      'Dapatkan informasi detail mengenai kurikulum, jadwal, dan daftar harga dalam format PDF.',
    buttonText: 'Unduh Brosur PDF',
    fileUrl: '/docs/LACX-Brochure.pdf',
  },
}
