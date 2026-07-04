import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react';
          }
          if (id.includes('framer-motion') || id.includes('recharts') || id.includes('lucide-react')) {
            return 'vendor';
          }
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
