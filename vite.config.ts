import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // El manifest y los íconos ya están armados a mano en index.html/public
      // (ver public/manifest.webmanifest): este plugin solo se encarga de
      // generar y registrar el service worker que cachea el build para que
      // la app abra sin señal.
      manifest: false,
      workbox: {
        // Por defecto solo cachea js/css/html: sin esto el logo, los íconos
        // y el manifest quedarían rotos al abrir la app sin señal.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        // No cachear /api/*: esas respuestas deben ser siempre en vivo (o
        // fallar explícitamente si no hay señal) para no mostrar datos
        // viejos como si fueran actuales.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
