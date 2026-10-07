// Only explicitly public credentials may enter the browser bundle.
export function publicSupabaseEnv(env: Record<string,string | undefined>) {
  const first = (names: string[]) => names.map(name=>env[name]?.trim()).find(Boolean) || '';
  const url = first(['VITE_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_URL']);
  const key = first(['VITE_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_ANON_KEY']);
  if (key.startsWith('sb_secret_')) throw new Error('Use somente a chave pública do Supabase no frontend.');
  if (key && !key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());
      if (payload.role !== 'anon') throw new Error();
    } catch { throw new Error('Chave pública Supabase inválida: não use service_role ou chaves secretas.'); }
  }
  if ((url && !key) || (key && !url)) throw new Error('Configure a URL e a chave pública do Supabase juntas.');
  if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error('URL Supabase inválida.');
  return {url,key};
}
