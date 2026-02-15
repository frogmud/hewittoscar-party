import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const PHOTOS_DIR = path.resolve(__dirname, '../_big_reference/HEWITTOSCARPARTY')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4009,
    fs: {
      allow: ['.', PHOTOS_DIR],
    },
  },
  resolve: {
    alias: {
      '@photos': PHOTOS_DIR,
    },
  },
})
