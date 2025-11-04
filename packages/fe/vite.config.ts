import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/markdown2adaptivecard/',
  optimizeDeps: {
    exclude: ['@microsoft/teams.cards']
  }
})
