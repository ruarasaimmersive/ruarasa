import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import node from '@astrojs/node'
import vercel from '@astrojs/vercel'

// Determine adapter dynamically based on the build environment
const adapter = process.env.VERCEL
  ? vercel()
  : node({
      mode: 'standalone',
    })

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: adapter,
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'RuaRasa Rekap',
          short_name: 'RuaRasa',
          description: 'Aplikasi Rekap Penjualan Offline-First',
          theme_color: '#ffffff',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webp}',
          ],
          // Don't fallback for navigation - Astro handles routes differently
          navigateFallback: null,
          // Alternatively, if you need offline support for navigation:
          // navigateFallback: '/index.html',
          // navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  },
})
