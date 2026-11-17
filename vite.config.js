import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/PaceOn/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trainingsanalyse',
        short_name: 'Trainingsanalyse',
        description: 'Lokale Analyse von Rennrad-, Lauf- und Brick-Trainings aus Amazfit/Zepp-FIT-Dateien.',
        theme_color: '#765d69',
        background_color: '#765d69',
        display: 'standalone',
        start_url: '/PaceOn/',
        scope: '/PaceOn/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // Fester Port für preview, damit die installierte PWA (Origin wird beim
  // Installieren fixiert) nach einem Neustart weiter erreichbar ist.
  preview: {
    port: 4173,
    strictPort: true,
  },
})
