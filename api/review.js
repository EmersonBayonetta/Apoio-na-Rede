import { createHmac } from 'node:crypto';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const placeUuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function createReviewHandler({env=process.env,fetchImpl=fetch}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'});}
  const site=env.APP_SITE_URL||'https://apoio-na-rede.vercel.app';
  if(req.headers.origin&&req.headers.origin!==new URL(site).origin)return res.status(403).json({error:'Origem não permitida.'});
  const body=req.body;
  const external=typeof body?.external_place_id==='string';
  if(!uuid.test(body?.visitorId??'')||(external?!/^[A-Za-z0-9_-]{3,255}$/.test(body.external_place_id):!placeUuid.test(body?.establishment_id??'')))return res.status(400).json({error:'Identificador inválido.'});
  const checkOnly=body.checkOnly===true;
  if(!checkOnly&&(!Number.isInteger(body.nota)||body.nota<1||body.nota>5||typeof body.comentario!=='string'||!body.comentario.trim()||body.comentario.length>5000||!['mobilidade','visual','auditiva','intelectual','invisivel'].includes(body.tipo_deficiencia_avaliada)))return res.status(400).json({error:'Informe a nota e o comentário.'});
  const first=names=>names.map(name=>env[name]?.trim()).find(Boolean);
  const root=first(['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'])?.replace(/\/$/,'');
  const secret=first(['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']);
  if(!root||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root)||!secret)return res.status(503).json({error:'Avaliações temporariamente indisponíveis.'});
  const visitor_hash=createHmac('sha256',secret).update(body.visitorId.toLowerCase()).digest('hex');
  const details={...(external?{external_place_id:body.external_place_id}:{establishment_id:body.establishment_id}),nota:body.nota,comentario:body.comentario,tipo_deficiencia_avaliada:body.tipo_deficiencia_avaliada};
  try{
   const rpc=external?(checkOnly?'has_external_visitor_review':'submit_external_visitor_review'):(checkOnly?'has_visitor_review':'submit_visitor_review');
   const result=await fetchImpl(`${root}/rest/v1/rpc/${rpc}`,{method:'POST',headers:{apikey:secret,'Content-Type':'application/json',...(secret.startsWith('eyJ')?{Authorization:`Bearer ${secret}`}:{})},body:JSON.stringify(checkOnly?{place_id:external?body.external_place_id:body.establishment_id,visitor_hash}:{details,visitor_hash}),signal:AbortSignal.timeout(8000)});
   if(!result.ok){const failure=await result.json().catch(()=>({}));return res.status(failure.code==='23505'?409:503).json({error:failure.code==='23505'?'Você já publicou uma avaliação para este local.':'Não foi possível publicar a avaliação agora.'});}
   const data=await result.json();return res.status(checkOnly?200:201).json(checkOnly?{reviewed:data}:data);
  }catch{return res.status(503).json({error:'Avaliações temporariamente indisponíveis.'});}
 };
}
export default createReviewHandler();
