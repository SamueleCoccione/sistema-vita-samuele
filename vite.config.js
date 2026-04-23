import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy per Strava API — evita CORS in dev
      '/strava-proxy': {
        target: 'https://www.strava.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/strava-proxy/, ''),
      },
    },
  },
})
