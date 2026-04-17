import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: false,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/booking': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/message': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/notification': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/payment': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/property': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/wishlist': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
