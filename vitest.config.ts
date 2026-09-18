import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
