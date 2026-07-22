import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Three.js runtimes are route-split so non-3D pages avoid their entry cost.
  build: {
    chunkSizeWarningLimit: 600,
  },
})
