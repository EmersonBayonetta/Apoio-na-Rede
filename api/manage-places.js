import { createClient } from '@supabase/supabase-js';
import { validatePlaceEdit } from './_lib/placeManagementValidation.js';
import { storeRegistrationPhotos } from './_lib/registrationPhotos.js';

const first = (env, names) => names.map(name => env[name]?.trim()).find(Boolean);
const columns = 'id,nome,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,telefone,whatsapp,horario_funcionamento,status,atualizado_em';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createPlaceManagementHandler({env = process.env, fetchImpl = fetch} = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET','PATCH'].includes(req.method)) { res.setHeader('Allow','GET, PATCH'); return res.status(405).json({error:'Método não permitido.'}); }
    const site = env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
    if (req.headers.origin && req.headers.origin !== new URL(site).origin) return res.status(403).json({error:'Origem não permitida.'});
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({error:'Entre com o e-mail do administrador.'});
    const root = first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
    const key = first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']);
    if (!root || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root) || !key) return res.status(503).json({error:'Gestão temporariamente indisponível.'});
    // Database reads and updates use the administrator's JWT, retaining RLS checks.
    const client = createClient(root,key,{global:{fetch:fetchImpl,headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
    try {
      const {data:auth,error:authError} = await client.auth.getUser(token);
      if (authError || !auth.user) return res.status(401).json({error:'Seu acesso expirou. Entre novamente.'});
      const {data:admin,error:adminError} = await client.rpc('is_site_admin');
      if (adminError || admin !== true) return res.status(403).json({error:'Este e-mail não tem autorização para gerenciar locais.'});
      if (req.method === 'GET') {
        const query = new URL(req.url,'https://local.invalid').searchParams;
        const id = query.get('id');
        if (id) {
          if (!uuid.test(id)) return res.status(400).json({error:'Local inválido.'});
          const {data,error} = await client.from('establishments').select(columns).eq('id',id).maybeSingle();
          if (error) throw error;
          return data ? res.status(200).json({place:data}) : res.status(404).json({error:'Local não encontrado.'});
        }
        const page = Number(query.get('page') || 0);
        const search = (query.get('q') || '').trim();
        const status = query.get('status') || '';
        if (!Number.isInteger(page) || page < 0 || page > 100000 || search.length > 100 || (status && !['pendente','verificado','rejeitado'].includes(status))) return res.status(400).json({error:'Busca inválida.'});
        let request = client.from('establishments').select(columns,{count:'exact'}).order('nome').order('id').range(page * 20,page * 20 + 19);
        if (search) request = request.ilike('nome',`%${search.replace(/[\\%_]/g,'\\$&')}%`);
        if (status) request = request.eq('status',status);
        const {data,error,count} = await request;
        if (error) throw error;
        return res.status(200).json({places:data,total:count || 0});
      }
      let details;
      const {id,expectedUpdatedAt} = req.body || {};
      try {
        if (JSON.stringify(req.body).length > 2900000 || !uuid.test(id || '') || !(expectedUpdatedAt === null || (typeof expectedUpdatedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(expectedUpdatedAt) && Number.isFinite(Date.parse(expectedUpdatedAt))))) throw Error('Dados da edição inválidos. Reabra o cadastro.');
        details = validatePlaceEdit(req.body.details);
      } catch (error) { return res.status(400).json({error:error.message}); }
      const {data:current,error:loadError} = await client.from('establishments').select('id,atualizado_em').eq('id',id).maybeSingle();
      if (loadError) throw loadError;
      if (!current) return res.status(404).json({error:'Local não encontrado.'});
      if (current.atualizado_em !== expectedUpdatedAt) return res.status(409).json({error:'Este local foi alterado desde que você o abriu. Recarregue o cadastro antes de salvar.'});
      let uploaded;
      if (details.fotos.some(photo => photo.startsWith('data:'))) {
        const secret = first(env,['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
        if (!secret) return res.status(503).json({error:'O envio de fotos está temporariamente indisponível.'});
        uploaded = await storeRegistrationPhotos(root,secret,details.fotos,fetchImpl);
        details.fotos = uploaded.urls;
      }
      let update = client.from('establishments').update({...details,atualizado_em:new Date().toISOString()}).eq('id',id);
      update = expectedUpdatedAt === null ? update.is('atualizado_em',null) : update.eq('atualizado_em',expectedUpdatedAt);
      const {data:saved,error:saveError} = await update.select(columns).maybeSingle();
      if (saveError) { await uploaded?.cleanup().catch(() => {}); throw saveError; }
      if (!saved) { await uploaded?.cleanup().catch(() => {}); return res.status(409).json({error:'Este local foi alterado. Recarregue o cadastro antes de salvar.'}); }
      return res.status(200).json({place:saved,message:'Alterações salvas.'});
    } catch { return res.status(503).json({error:'Não foi possível concluir a operação. Confira sua conexão e tente novamente.'}); }
  };
}
export default createPlaceManagementHandler();
