import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    exclude: [
      'react-hot-toast',
      'react-router-dom',
      'react-icons'
    ],
  },
})
