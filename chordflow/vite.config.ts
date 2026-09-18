import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // Service worker para que la app cargue y suene sin conexión:
    // precachea el build (JS, CSS, HTML) y las muestras del Rhodes.
    // La biblioteca ya vive en localStorage; lo único que requiere red
    // es guardar y cargar desde la nube.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ChordFlow — Progresiones armónicas',
        short_name: 'ChordFlow',
        lang: 'es',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3}'],
        runtimeCaching: [
          {
            // Tipografías de Google Fonts (index.html)
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
