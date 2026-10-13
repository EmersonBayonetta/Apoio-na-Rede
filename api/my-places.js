import { validatePlaceEdit } from './_lib/placeManagementValidation.js';
import { storeRegistrationPhotos } from './_lib/registrationPhotos.js';

const first = (env, names) => names.map(name => env[name]?.trim()).find(Boolean);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timestamp = value => value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)));
const missingChangeRequestsSetup = failure => ['PGRST202','42883','42P01'].includes(failure?.code) || /(?:my_establishments_with_changes|request_establishment_change|establishment_change_requests)/i.test(String(failure?.message || ''));
const setupMessage = 'A área Meus locais ainda não foi ativada no banco de dados. Aplique database/establishment_change_requests.sql no Supabase.';

export function createMyPlacesHandler({env = process.env, fetchImpl = fetch} = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({error:'Método não permitido.'}); }
    const site = env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
    if (req.headers.origin && req.headers.origin !== new URL(site).origin) return res.status(403).json({error:'Origem não permitida.'});
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({error:'Entre para acessar seus locais.'});
    const root = first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
    const key = first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']);
    if (!root || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root) || !key) return res.status(503).json({error:'Seus locais estão temporariamente indisponíveis.'});
    try {
      // Keep token verification identical to the protected registration route.
      // This avoids relying on a server-side Supabase client session in a serverless request.
      const identity = await fetchImpl(`${root}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
      const auth = identity.ok ? await identity.json().catch(() => null) : null;
      if (!auth?.id) return res.status(401).json({error:'Sua sessão expirou. Entre novamente.'});
      const userHeaders = {apikey:key,'Content-Type':'application/json',Authorization:`Bearer ${token}`};
      const rpc = (name, body = {}) => fetchImpl(`${root}/rest/v1/rpc/${name}`,{method:'POST',headers:userHeaders,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
      if (req.method === 'GET') {
        const result = await rpc('my_establishments_with_changes');
        const data = await result.json().catch(() => null);
        // Missing RPCs/tables mean database/establishment_change_requests.sql was not applied.
        if (!result.ok) return res.status(503).json({error:missingChangeRequestsSetup(data) ? setupMessage : 'Não foi possível carregar seus locais. Tente novamente.'});
        return res.status(200).json({places:data || []});
      }
      const {id, expectedUpdatedAt, details: input} = req.body || {};
      let details;
      try {
        if (JSON.stringify(req.body).length > 2900000 || !uuid.test(id || '') || !timestamp(expectedUpdatedAt)) throw Error('Dados da alteração inválidos. Reabra o local e tente novamente.');
        details = validatePlaceEdit(input);
      } catch (error) { return res.status(400).json({error:error.message}); }
      let uploaded;
      if (details.fotos.some(photo => photo.startsWith('data:'))) {
        const secret = first(env,['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
        if (!secret) return res.status(503).json({error:'O envio de fotos está temporariamente indisponível.'});
        uploaded = await storeRegistrationPhotos(root,secret,details.fotos,fetchImpl);
        details.fotos = uploaded.urls;
      }
      const result = await rpc('request_establishment_change',{requested_establishment_id:id,requested_details:details,requested_updated_at:expectedUpdatedAt});
      const data = await result.json().catch(() => ({}));
      if (!result.ok) { await uploaded?.cleanup().catch(() => {}); const status = data.code === '23505' ? 409 : missingChangeRequestsSetup(data) ? 503 : 400; return res.status(status).json({error:missingChangeRequestsSetup(data) ? setupMessage : data.message || 'Não foi possível enviar a alteração.'}); }
      return res.status(201).json({changeRequest:data,message:'Alteração enviada para análise dos administradores.'});
    } catch { return res.status(503).json({error:'Não foi possível concluir a operação. Confira sua conexão e tente novamente.'}); }
  };
}
export default createMyPlacesHandler();
