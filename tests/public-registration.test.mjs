import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegistrationHandler} from '../api/register-place.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const details={nome:'Local',descricao:'Descrição adequada para o cadastro.',categoria:'educacao',endereco:'Rua Teste',cidade:'Cataguases',estado:'MG',latitude:-21.39,longitude:-42.69,fotos:[],status:'verificado',dono_id:'attacker'};
const body={details,criteria:[{tipo_deficiencia:'mobilidade',criterio:'Entrada',presente:true}],owner_email:'attacker@example.invalid'};
const result=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const run=async(handler,request={method:'POST',headers:{origin:env.APP_SITE_URL},body})=>{const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};await handler(request,res);return res;};
test('public registration queues for panel review without sending email or accepting protected fields',async()=>{
 const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return result({id:'saved',owner_email:'owner@example.invalid',review_recipients:[{email:'owner@example.invalid'}]});}});
 const response=await run(handler);assert.equal(response.code,201);assert.equal(response.body.status,'pendente');assert.equal(response.body.notified,false);assert.match(response.body.message,/painel administrador/);
 assert.equal(calls.length,1);assert.equal(Object.hasOwn(calls[0].body.details,'status'),false);assert.equal(Object.hasOwn(calls[0].body.details,'dono_id'),false);
 assert.equal(JSON.stringify(response.body).includes('owner@example.invalid'),false);
});
test('routes and professionals also queue without email or automatic publication',async()=>{
 for(const [kind,details] of [['routes',{titulo:'Rua A → Rua B',cidade:'Cataguases',ponto_origem:'Rua A',ponto_destino:'Rua B',trecho_descricao:'Condições observadas',status:'verificado',auditada:true,author_id:'attacker'}],['professionals',{nome:'Teste',especialidade:'Fisioterapia',cidade:'Cataguases',estado:'MG',atende_por_tipo:[],telefone:'(32) 99999-0000',status:'verificado',author_id:'attacker'}]]){
  const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return result({id:'saved'});}});
  const response=await run(handler,{method:'POST',headers:{},body:{kind,details}});assert.equal(response.code,201);assert.equal(calls.length,1);assert.equal(calls[0].body.kind,kind);
  for(const field of ['status','auditada','author_id'])assert.equal(Object.hasOwn(calls[0].body.details,field),false);
 }
});
test('invalid input, foreign origin, unsupported methods and missing configuration fail before persistence',async()=>{
 const handler=createRegistrationHandler({env,fetchImpl:async()=>{throw Error('Unexpected');}});
 assert.equal((await run(handler,{method:'POST',headers:{origin:'https://other.invalid'},body})).code,403);
 assert.equal((await run(handler,{method:'POST',headers:{},body:{details:{},criteria:[]}})).code,400);
 assert.equal((await run(handler,{method:'GET',headers:{}})).code,405);
 assert.equal((await run(createRegistrationHandler({env:{}}))).code,503);
});
test('rate limits preserve pending semantics and return 429 without sending emails',async()=>{
 const handler=createRegistrationHandler({env,fetchImpl:async()=>result({message:'Limite de cadastros'},400)});
 assert.equal((await run(handler)).code,429);
});
test('uploaded photo URLs are saved before panel review; rejected registration cleans up files',async()=>{
 const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,0,255,217]).toString('base64');
 for(const rejected of [false,true]){const calls=[];const handler=createRegistrationHandler({env,fetchImpl:async(url,options)=>{calls.push({url,options});if(url.includes('/bucket/'))return result({id:'place-photos',public:true});if(url.includes('submit_public_registration'))return result(rejected?{message:'Limite'}:{id:'saved'},rejected?400:200);return result({});}});
  const response=await run(handler,{method:'POST',headers:{},body:{...body,details:{...details,fotos:[photo]}}});assert.equal(response.code,rejected?429:201);
  const submission=JSON.parse(calls.find(call=>call.url.includes('submit_public_registration')).options.body);assert.ok(submission.details.fotos[0].includes('/storage/v1/object/public/place-photos/'));
  assert.equal(calls.some(call=>call.options.method==='DELETE'),rejected);assert.equal(calls.some(call=>call.url.includes('/auth/')),false);
 }
});
