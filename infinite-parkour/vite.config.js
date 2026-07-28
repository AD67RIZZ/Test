import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standard Vite configuration. No server runtime or platform-specific adapter.
export default defineConfig({
  plugins: [react()],
})
