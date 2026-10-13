import { createClient } from '@supabase/supabase-js';

const first = (env, names) => names.map(name => env[name]?.trim()).find(Boolean);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createChangeRequestManagementHandler({env = process.env, fetchImpl = fetch} = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'PATCH'].includes(req.method)) { res.setHeader('Allow','GET, PATCH'); return res.status(405).json({error:'Método não permitido.'}); }
    const site = env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
    if (req.headers.origin && req.headers.origin !== new URL(site).origin) return res.status(403).json({error:'Origem não permitida.'});
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({error:'Entre com o e-mail do administrador.'});
    const root = first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
    const key = first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']);
    if (!root || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root) || !key) return res.status(503).json({error:'Gestão temporariamente indisponível.'});
    const client = createClient(root,key,{global:{fetch:fetchImpl,headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
    try {
      const {data:auth,error:authError} = await client.auth.getUser(token);
      if (authError || !auth.user) return res.status(401).json({error:'Seu acesso expirou. Entre novamente.'});
      const {data:admin,error:adminError} = await client.rpc('is_site_admin');
      if (adminError || admin !== true) return res.status(403).json({error:'Este e-mail não tem autorização para gerenciar alterações.'});
      if (req.method === 'GET') {
        const {data,error} = await client.rpc('admin_establishment_change_requests');
        if (error) throw error;
        return res.status(200).json({requests:data || []});
      }
      const {id,approve,reason} = req.body || {};
      if (!uuid.test(id || '') || typeof approve !== 'boolean' || (reason !== undefined && (typeof reason !== 'string' || reason.length > 1000))) return res.status(400).json({error:'Decisão inválida.'});
      const {error} = await client.rpc('decide_establishment_change',{request_id:id,approve,reason:typeof reason === 'string' ? reason : null});
      if (error) return res.status(409).json({error:error.message || 'Não foi possível registrar a decisão.'});
      return res.status(200).json({message:approve ? 'Alteração aprovada e publicada.' : 'Alteração recusada.'});
    } catch { return res.status(503).json({error:'Não foi possível concluir a operação. Confira sua conexão e tente novamente.'}); }
  };
}
export default createChangeRequestManagementHandler();
