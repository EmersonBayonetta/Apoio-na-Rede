import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistrationHandler } from '../api/register-place.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const details={nome:'Local',descricao: 'Descrição adequada para o cadastro.',categoria:'educacao',endereco:'Rua Teste',cidade:'Cataguases',estado:'MG',latitude:-21.39,longitude:-42.69,fotos:[],status:'verificado',dono_id:'attacker'};
const body={details,criteria:[{tipo_deficiencia:'mobilidade',criterio:'Entrada',presente:true}],owner_email:'attacker@example.invalid'};
test('review links go only to database-selected reviewers and require complete acceptance to mark notification',async()=>{
 for(const partial of [false,true]){
  const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{
   if(String(url).includes('/auth/v1/user'))return result({id:'00000000-0000-4000-8000-000000000010'});
   const payload=JSON.parse(options.body);calls.push({url,payload});
   if(url.includes('submit_authenticated_registration'))return result({id:'saved',owner_email:'owner@example.invalid',review_recipients:[{email:'owner@example.invalid',create_user:false},{email:'reviewer@example.invalid',create_user:true}]});
   return partial && payload.email==='reviewer@example.invalid'?new Response('{}',{status:429}):result({});
  }});
  const response=await run(handler,{method:'POST',headers:{},body:{...body,review_recipients:[{email:'attacker@example.invalid',create_user:true}]}});
  assert.equal(response.code,201);assert.equal(response.body.notified,!partial);
  const emails=calls.filter(call=>call.url.includes('/auth/')).map(call=>call.payload);
  assert.deepEqual(emails,[{email:'owner@example.invalid',create_user:false},{email:'reviewer@example.invalid',create_user:true}]);
  assert.equal(calls.some(call=>call.url.includes('mark_registration_notified')),!partial);
  assert.equal(JSON.stringify(response.body).includes('reviewer@example.invalid'),false);
 }
});
test('local image registration stores an HTTP URL before submission and cleans up on rejection', async () => {
 const photo=`data:image/jpeg;base64,${Buffer.from([255,216,255,0,255,217]).toString('base64')}`;
 for(const rejected of [false,true]) {
  const calls=[];
  const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{
   if(String(url).includes('/auth/v1/user'))return result({id:'00000000-0000-4000-8000-000000000010'});
   calls.push({url:String(url),options});
   if(String(url).includes('/bucket/'))return result({id:'place-photos',public:true});
   if(String(url).includes('submit_authenticated_registration'))return rejected?new Response(JSON.stringify({message:'Limite'}),{status:400}):result({id:'saved',owner_email:'owner@example.invalid'});
   return result({});
  }});
  const response=await run(handler,{method:'POST',headers:{},body:{...body,details:{...details,fotos:[photo]}}});
  assert.equal(response.code,rejected?429:201);
  const submission=JSON.parse(calls.find(call=>call.url.includes('submit_authenticated_registration')).options.body);
  assert.match(submission.details.fotos[0],/^https:\/\/test.supabase.co\/storage\/v1\/object\/public\/place-photos\//);
  assert.equal(calls.some(call=>call.options.method==='DELETE'),rejected);
 }
});
const result=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const run=async(handler,request={})=>{
 const normalized={method:'POST',body, ...request,headers:{origin:env.APP_SITE_URL,'x-forwarded-for':'127.0.0.1',authorization:'Bearer valid-token-for-authenticated-registration',...(request.headers??{})}};
 const res={code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
 await handler(normalized,res);return res;
};
test('public registration remains pending, mails only the database owner through Supabase and strips privileged fields',async()=>{
 const calls=[];
 const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{
  if(String(url).includes('/auth/v1/user'))return result({id:'00000000-0000-4000-8000-000000000010'});
  calls.push({url,body:JSON.parse(options.body)});
  return url.includes('submit_authenticated_registration')?result({id:'00000000-0000-4000-8000-000000000001',owner_email:'owner@example.invalid'}):result({});
 }});
 const res=await run(handler);
 assert.equal(res.code,201);assert.equal(res.body.notified,true);assert.equal(res.body.status,'pendente');
 assert.equal(Object.hasOwn(calls[0].body.details,'status'),false);assert.equal(Object.hasOwn(calls[0].body.details,'dono_id'),false);
 assert.equal(calls[1].body.email,'owner@example.invalid');assert.equal(calls[1].body.create_user,false);
 const redirect=new URL(new URL(calls[1].url).searchParams.get('redirect_to'));
 assert.equal(redirect.pathname,'/revisao');assert.equal(redirect.searchParams.get('cadastro'),res.body.id);
 assert.equal(calls.some(c=>c.url.includes('resend')),false);
 assert.equal(JSON.stringify(res.body).includes('owner@example.invalid'),false);
});
test('Supabase email quota failure preserves registration and never claims notification or marks it delivered',async()=>{
 const calls=[];
 const handler=createRegistrationHandler({env,fetchImpl:async(url)=>{
  if(String(url).includes('/auth/v1/user'))return result({id:'00000000-0000-4000-8000-000000000010'});
  calls.push(url);
  if(url.includes('submit_authenticated_registration'))return result({id:'saved',owner_email:'owner@example.invalid'});
  return new Response('{}',{status:429});
 }});
 const res=await run(handler);
 assert.equal(res.code,201);assert.equal(res.body.id,'saved');assert.equal(res.body.notified,false);
 assert.equal(calls.some(url=>url.includes('mark_registration_notified')),false);
});
test('public submission rejects invalid fields, foreign origins and unavailable configuration before sending email',async()=>{
 const handler=createRegistrationHandler({env,fetchImpl:async()=>{throw Error('unexpected request');}});
 assert.equal((await run(handler,{method:'POST',headers:{origin:'https://other.invalid'},body})).code,403);
 assert.equal((await run(handler,{method:'POST',headers:{},body:{details:{},criteria:[]}})).code,400);
 assert.equal((await run(handler,{method:'GET',headers:{}})).code,405);
 assert.equal((await run(createRegistrationHandler({env:{},fetchImpl:async()=>{throw Error();}}))).code,503);
});
test('location registration rejects missing or invalid sessions before storage writes',async()=>{
 const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url)=>{calls.push(String(url));return new Response('{}',{status:401});}});
 const noToken=await run(handler,{method:'POST',headers:{origin:env.APP_SITE_URL},body});
 const expired=await run(handler,{method:'POST',headers:{origin:env.APP_SITE_URL,authorization:'Bearer expired-token'},body});
 assert.equal(noToken.code,401);assert.equal(expired.code,401);
 assert.equal(calls.some(url=>url.includes('submit_authenticated_registration')),false);
});
test('routes and professionals use Supabase owner review and never accept publication, audit or owner fields',async()=>{
 for(const [kind,details] of [['routes',{titulo:'Rua A → Rua B',cidade:'Cataguases',ponto_origem:'Rua A',ponto_destino:'Rua B',trecho_descricao:'Condições observadas',status:'verificado',auditada:true,author_id:'attacker'}],['professionals',{nome:'Teste',especialidade:'Fisioterapia',cidade:'Cataguases',estado:'MG',atende_por_tipo:[],telefone:'(32) 99999-0000',status:'verificado',author_id:'attacker'}]]){
  const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{if(String(url).includes('/auth/v1/user'))return result({id:'00000000-0000-4000-8000-000000000010'});calls.push({url,body:JSON.parse(options.body)});return url.includes('submit_public_directory')?result({id:'00000000-0000-4000-8000-000000000002',owner_email:'owner@example.invalid'}):result({});}});
  const res=await run(handler,{method:'POST',headers:{origin:env.APP_SITE_URL},body:{kind,details}});
  assert.equal(res.code,201);assert.equal(res.body.status,'pendente');assert.equal(calls[0].body.kind,kind);
  for(const key of ['status','auditada','author_id'])assert.equal(Object.hasOwn(calls[0].body.details,key),false);
  assert.equal(new URL(new URL(calls[1].url).searchParams.get('redirect_to')).searchParams.get('tipo'),kind);
  assert.ok(calls[2].url.includes('mark_directory_notified'));
 }
});
