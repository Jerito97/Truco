import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // VitePWA solo hace falta acá para que exista el módulo virtual
  // "virtual:pwa-register/react" y no rompa el resolve de UpdateToast.tsx:
  // el test de ese componente mockea el hook, no le importa el resto.
  plugins: [react(), tailwindcss(), VitePWA({ registerType: 'prompt' })],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    // Zona horaria fija (Argentina, sin horario de verano) para que
    // formatDate y cualquier otro uso de fechas locales no dependa de en
    // qué máquina/CI se corran los tests.
    env: { TZ: 'America/Argentina/Buenos_Aires' },
  },
})
