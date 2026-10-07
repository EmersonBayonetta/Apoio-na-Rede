const first = (env,names) => names.map(name=>env[name]?.trim()).find(Boolean);

export function createAdminAccessHandler({env=process.env,fetchImpl=fetch}={}) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');
    if (req.method!=='POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'});}
    const authorization=req.headers.authorization;
    if (typeof authorization!=='string' || !/^Bearer \S{20,10000}$/.test(authorization)) return res.status(401).json({error:'Entre na sua conta para solicitar acesso.'});
    const url=first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL']);
    const publicKey=first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY','VITE_SUPABASE_ANON_KEY']);
    if (!url || !publicKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) return res.status(503).json({error:'Serviço de solicitações indisponível.'});
    const root=url.replace(/\/$/,'');
    const call = async (path,headers,body) => {
      const response=await fetchImpl(root+path,{method:body ? 'POST' : 'GET',headers:{...headers,'Content-Type':'application/json'},...(body ? {body:JSON.stringify(body)} : {}),signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw Object.assign(new Error('Supabase request failed'),{status:response.status});
      return response.json();
    };
    let request;
    try {
      const user=await call('/auth/v1/user',{apikey:publicKey,Authorization:authorization});
      if (!user.id || !user.email_confirmed_at) return res.status(401).json({error:'Confirme seu e-mail antes de solicitar acesso.'});
      request=await call('/rest/v1/rpc/request_admin_access',{apikey:publicKey,Authorization:authorization},{});
      if (request.status!=='pendente' || request.notified) return res.status(200).json(request);
    } catch(error) {return res.status(error.status===401 || error.status===403 ? 401 : 503).json({error:'Não foi possível registrar a solicitação. Confira sua conta e tente novamente.'});}
    const pending = () => res.status(202).json({...request,notified:false,message:'Solicitação registrada. O aviso por e-mail está pendente; tente novamente mais tarde.'});
    const secret=first(env,['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
    if (!secret || !env.RESEND_API_KEY || !env.ADMIN_EMAIL_FROM) return pending();
    try {
      const serviceHeaders={apikey:secret,...(secret.startsWith('eyJ') ? {Authorization:`Bearer ${secret}`} : {})};
      const notification=await call('/rest/v1/rpc/admin_access_notification',serviceHeaders,{request_id:request.id});
      if (!notification || notification.status!=='pendente') return res.status(200).json({...request,status:notification?.status || request.status,notified:notification?.notified || false});
      if (notification.notified) return res.status(200).json({...request,notified:true});
      if (!notification.owner_email) return pending();
      const site=env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
      const link=new URL('/gestao',site);link.searchParams.set('solicitacao',request.id);
      if (link.protocol!=='https:') return pending();
      const email=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`admin-access/${request.id}`},body:JSON.stringify({from:env.ADMIN_EMAIL_FROM,to:[notification.owner_email],subject:'Apoio na Rede — solicitação de acesso administrativo',text:`${notification.requester_email} solicitou acesso à administração do Apoio na Rede.\n\nRevise e aprove ou recuse no painel:\n${link.href}\n\nEsta solicitação ainda não concede acesso. A decisão exige seu login.`}),signal:AbortSignal.timeout(8000)});
      if (!email.ok) return pending();
      await call('/rest/v1/rpc/mark_admin_access_notified',serviceHeaders,{request_id:request.id});
      return res.status(200).json({...request,notified:true});
    } catch {return pending();}
  };
}
export default createAdminAccessHandler();
