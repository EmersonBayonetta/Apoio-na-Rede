import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistrationHandler } from '../api/register-place.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const details={nome:'Local',descricao:'Descrição',categoria:'educacao',endereco:'Rua Teste',cidade:'Cataguases',estado:'MG',latitude:-21.39,longitude:-42.69,fotos:[],status:'verificado',dono_id:'attacker'};
const body={details,criteria:[{tipo_deficiencia:'mobilidade',criterio:'Entrada',presente:true}],owner_email:'attacker@example.invalid'};
const result=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const run=async(handler,request={method:'POST',headers:{origin:env.APP_SITE_URL,'x-forwarded-for':'127.0.0.1'},body})=>{
 const res={code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
 await handler(request,res);return res;
};
test('public registration remains pending, mails only the database owner through Supabase and strips privileged fields',async()=>{
 const calls=[];
 const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body)});
  return url.includes('submit_public_registration')?result({id:'00000000-0000-4000-8000-000000000001',owner_email:'owner@example.invalid'}):result({});
 }});
 const res=await run(handler);
 assert.equal(res.code,201);assert.equal(res.body.notified,true);assert.equal(res.body.status,'pendente');
 assert.equal(Object.hasOwn(calls[0].body.details,'status'),false);assert.equal(Object.hasOwn(calls[0].body.details,'dono_id'),false);
 assert.match(calls[0].body.source_hash,/^[a-f0-9]{64}$/);
 assert.equal(calls[1].body.email,'owner@example.invalid');assert.equal(calls[1].body.create_user,false);
 const redirect=new URL(new URL(calls[1].url).searchParams.get('redirect_to'));
 assert.equal(redirect.pathname,'/revisao');assert.equal(redirect.searchParams.get('cadastro'),res.body.id);
 assert.equal(calls.some(c=>c.url.includes('resend')),false);
 assert.equal(JSON.stringify(res.body).includes('owner@example.invalid'),false);
});
test('Supabase email quota failure preserves registration and never claims notification or marks it delivered',async()=>{
 const calls=[];
 const handler=createRegistrationHandler({env,fetchImpl:async(url)=>{
  calls.push(url);
  if(url.includes('submit_public_registration'))return result({id:'saved',owner_email:'owner@example.invalid'});
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
