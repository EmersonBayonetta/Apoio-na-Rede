import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      // Os perfis de teste do Chrome contêm arquivos bloqueados no Windows.
      ignored: ['**/tmp/**'],
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
    include: ['@googlemaps/js-api-loader'],
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})

