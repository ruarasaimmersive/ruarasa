export interface ProductConfig {
  id: string
  name: string
  price: number
  emoji: string
  color: string
  shadow: string
}

export const DEFAULT_PRODUCTS: ProductConfig[] = [
  {
    id: 'p2',
    name: 'Tiket Immersive',
    price: 35000,
    emoji: '🎫',
    color: 'bg-emerald-600',
    shadow: 'shadow-emerald-500/30',
  },
  {
    id: 'p1',
    name: 'Tiket Bundling Nirwana',
    price: 40000,
    emoji: '🎫',
    color: 'bg-blue-600',
    shadow: 'shadow-blue-500/30',
  },
  {
    id: 'p6',
    name: 'Tiket Bundling Ruarasa',
    price: 45000,
    emoji: '🎫',
    color: 'bg-indigo-600',
    shadow: 'shadow-indigo-500/30',
  },
  {
    id: 'p7',
    name: 'Tiket All In',
    price: 55000,
    emoji: '🎫',
    color: 'bg-sky-600',
    shadow: 'shadow-sky-500/30',
  },
]
