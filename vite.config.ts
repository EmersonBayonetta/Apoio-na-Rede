import { defineConfig, loadEnv } from 'vite'
import { publicSupabaseEnv } from './scripts/public-supabase-env.ts'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode,process.cwd(),'');
  const database = env.VITE_DATA_MODE === 'demo' ? {url:'',key:''} : publicSupabaseEnv(env);
  if (env.VERCEL_ENV === 'production' && (!database.url || !database.key)) throw new Error('Configure as variáveis públicas Supabase na Vercel antes de publicar.');
  return {
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(database.url),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(database.key),
  },
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
  };
})

