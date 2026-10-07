import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let client: SupabaseClient<Database> | null = null;

export function getSupabase() {
  if (import.meta.env.VITE_DATA_MODE === 'demo' || (!url && !key)) return null;
  if (!url || !key) throw new Error('Configuração do banco incompleta.');
  client ??= createClient<Database>(url, key);
  return client;
}
