import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    // screens are lazy chunks (src/lib/routes.jsx); keep the shared runtime in long-cacheable vendor chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lottie-react') || id.includes('node_modules/lottie-web')) return 'lottie'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
        },
      },
    },
  },
})
