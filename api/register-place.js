import { createHmac } from 'node:crypto';
import { validateRegistration } from './_lib/registrationValidation.js';
const first=(env,names)=>names.map(name=>env[name]?.trim()).find(Boolean);
const categories=['alimentacao','saude','lazer_cultura','comercio_loja','servico_publico','banheiro_adaptado','educacao','hospedagem','transporte_mobilidade'];

export function createRegistrationHandler({env=process.env,fetchImpl=fetch}={}) {
 return async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'});}
  const site=env.APP_SITE_URL || 'https://apoio-na-rede.vercel.app';
  if(req.headers.origin && req.headers.origin!==new URL(site).origin)return res.status(403).json({error:'Origem não permitida.'});
  let details,criteria;
  try {
   if(JSON.stringify(req.body).length>50000)throw Error('Cadastro muito grande.');
   const input=req.body?.details;
   details=Object.fromEntries(['nome','place_id','categoria','endereco','bairro','cidade','estado','cep','latitude','longitude','descricao','fotos','telefone','whatsapp','horario_funcionamento'].map(key=>[key,input?.[key]]).filter(([,value])=>value!==undefined));
   if(!['nome','descricao','endereco','cidade','estado'].every(key=>typeof details[key]==='string'&&details[key].length<=5000)||!Array.isArray(details.fotos)||details.fotos.length>10||details.fotos.some(value=>typeof value!=='string'||value.length>2000)||!categories.includes(details.categoria))throw Error('Preencha os dados do cadastro corretamente.');
   validateRegistration(details);
   if(!Array.isArray(req.body.criteria)||req.body.criteria.length>50)throw Error('Recursos de acessibilidade inválidos.');
   criteria=req.body.criteria.map(c=>{
    if(!c||typeof c.criterio!=='string'||c.criterio.length>500||!['mobilidade','visual','auditiva','intelectual','invisivel'].includes(c.tipo_deficiencia)||![true,false,null].includes(c.presente))throw Error('Recursos de acessibilidade inválidos.');
    return {tipo_deficiencia:c.tipo_deficiencia,criterio:c.criterio,presente:c.presente,recurso:c.recurso,observacao_livre:typeof c.observacao_livre==='string'?c.observacao_livre.slice(0,1000):null};
   });
  } catch(error){return res.status(400).json({error:error.message||'Cadastro inválido.'});}
  const root=first(env,['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
  const secret=first(env,['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
  const publicKey=first(env,['SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']);
  if(!root||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root)||!secret||!publicKey)return res.status(503).json({error:'Cadastro temporariamente indisponível. Tente novamente mais tarde.'});
  const headers={apikey:secret,'Content-Type':'application/json',...(secret.startsWith('eyJ')?{Authorization:`Bearer ${secret}`}:{})};
  const rpc=async(name,body)=>fetchImpl(`${root}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
  let submission;
  try {
   const address=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
   const source_hash=createHmac('sha256',secret).update(address).digest('hex');
   const result=await rpc('submit_public_registration',{details,criteria,source_hash});
   if(!result.ok){const failure=await result.json().catch(()=>({}));return res.status(String(failure.message).includes('Limite')?429:503).json({error:String(failure.message).includes('Limite')?'Limite de cadastros atingido. Tente novamente mais tarde.':'Não foi possível receber o cadastro. Tente novamente mais tarde.'});}
   submission=await result.json();
  } catch{return res.status(503).json({error:'Não foi possível receber o cadastro. Tente novamente mais tarde.'});}
  let notified=false;
  try {
   const redirect=new URL('/revisao',site);redirect.searchParams.set('cadastro',submission.id);
   const email=await fetchImpl(`${root}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect.href)}`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({email:submission.owner_email,create_user:false}),signal:AbortSignal.timeout(8000)});
   if(email.ok){notified=true;await rpc('mark_registration_notified',{registration_id:submission.id});}
  } catch { /* O cadastro permanece pendente quando o envio está indisponível. */ }
  return res.status(201).json({id:submission.id,status:'pendente',notified,message:notified?'Cadastro recebido. Um link de revisão foi solicitado ao responsável pelo site.':'Cadastro recebido e mantido pendente. Não foi possível enviar o aviso ao responsável agora; o envio de e-mail pode estar limitado.'});
 };
}
export default createRegistrationHandler();
