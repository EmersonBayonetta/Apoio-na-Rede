import assert from 'node:assert/strict';
import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), 'VITE_');
assert.ok(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Configure URL e chave pública.');
assert.ok(!env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_'), 'Chave secreta não pode ser usada no frontend.');
const root = env.VITE_SUPABASE_URL.replace(/\/$/, '');
for (const [endpoint, method, body, expected] of [
  ['/auth/v1/settings','GET',null,200],
  ['/rest/v1/establishments?select=id,nome,status,informado_responsavel,criteria:accessibility_criteria(*),reviews(*)&limit=1','GET',null,200],
  ['/rest/v1/rpc/get_place_accessibility','POST',{ requested_place_id: 'connectivity-check-no-place' },200],
  ['/rest/v1/rpc/get_approved_reports','POST',{ requested_key: 'connectivity-check-no-place' },200],
  ['/rest/v1/place_reports?select=id&limit=1','GET',null,401],
  ['/rest/v1/establishments?select=dono_id,motivo_rejeicao&limit=1','GET',null,401],
]) {
  const response = await fetch(root + endpoint, { method, headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type':'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  console.log(`${response.status} ${endpoint}`);
  assert.equal(response.status,expected, `Resposta inesperada em ${endpoint}`);
  if (endpoint.includes('/auth/')) {
    const settings = await response.json();
    assert.equal(settings.external.email,true,'Login por e-mail desabilitado.');
    console.log('Login por e-mail habilitado.');
  }
}
console.log(JSON.stringify({ googleMapsKeyConfigured: Boolean(env.VITE_GOOGLE_MAPS_API_KEY), googleMapIdConfigured: Boolean(env.VITE_GOOGLE_MAPS_MAP_ID) }));
console.log('Conexão e restrições anônimas verificadas.');
