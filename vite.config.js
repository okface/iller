import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Base path for assets. Default to '/' for local/dev/most hosts.
  // On GitHub Pages project sites, set env VITE_BASE="/<repo>/" (workflow already does this).
  base: process.env.VITE_BASE || '/',
}))
