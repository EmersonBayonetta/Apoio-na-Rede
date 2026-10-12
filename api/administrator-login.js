const first=(env,names)=>names.map(name=>env[name]?.trim()).find(Boolean);
export function createAdministratorLoginHandler({env=process.env,fetchImpl=fetch}={}) {
 return async (req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'});}
  const site=env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
  if(req.headers.origin && req.headers.origin!==new URL(site).origin)return res.status(403).json({error:'Origem não permitida.'});
  const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Informe um e-mail válido.'});
  const root=first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
  const key=first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']);
  const secret=first(env,['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
  if(!root || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root) || !key || !secret)return res.status(503).json({error:'Acesso temporariamente indisponível.'});
  const success=()=>res.status(200).json({message:'Se este e-mail estiver autorizado, você receberá um link de acesso. Abra o link para entrar.'});
  try {
   const permission=await fetchImpl(`${root}/rest/v1/rpc/administrator_login_allowed`,{method:'POST',headers:{apikey:secret,'Content-Type':'application/json',...(secret.startsWith('eyJ')?{Authorization:`Bearer ${secret}`}:{})},body:JSON.stringify({requested_email:email}),signal:AbortSignal.timeout(8000)});
   if(!permission.ok)throw Error();
   const allowed=await permission.json();
   if(allowed.allowed!==true)return success();
   const response=await fetchImpl(`${root}/auth/v1/otp?redirect_to=${encodeURIComponent(new URL('/gestao',site).href)}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,create_user:allowed.create_user===true}),signal:AbortSignal.timeout(8000)});
   if(!response.ok){const failure=await response.json().catch(()=>({}));return res.status(response.status===429?429:503).json({error:failure.code==='email_address_not_authorized'?'O envio para este e-mail está bloqueado pela configuração de e-mail do Supabase. O responsável precisa configurar o SMTP.':'Não foi possível enviar o link. Confira o e-mail e tente novamente mais tarde.'});}
   return success();
  }catch{return res.status(503).json({error:'Não foi possível solicitar o link. Tente novamente mais tarde.'});}
 };
}
export default createAdministratorLoginHandler();
