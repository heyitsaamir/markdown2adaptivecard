import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mk2ac/',
  optimizeDeps: {
    exclude: ['@microsoft/teams.cards']
  }
})
