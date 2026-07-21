import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The Three.js runtime is lazy-loaded only on pages that render a sandbox.
  build: {
    chunkSizeWarningLimit: 600,
  },
})
