import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8880',
        changeOrigin: true,
        secure: false
      },
      '/auth/google': {
        target: 'http://localhost:8880',
        changeOrigin: true,
        secure: false
      },
      '/auth/status': {
        target: 'http://localhost:8880',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
