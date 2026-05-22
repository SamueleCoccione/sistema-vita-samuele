import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // Proxy per Strava API — evita CORS in dev
      '/strava-proxy': {
        target: 'https://www.strava.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/strava-proxy/, ''),
      },
      // Proxy per SleepCloud — evita CORS in dev (in prod usa api/sleepcloud.js su Vercel)
      '/api/sleepcloud': {
        target: 'https://sleep-cloud.appspot.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/sleepcloud/, '/fetchRecords'),
      },
    },
  },
})
