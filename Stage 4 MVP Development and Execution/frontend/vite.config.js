import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        '/Users/aleph/MAMAR/Stage 4: MVP Development and Execution/frontend'
      ]
    }
  }
})
