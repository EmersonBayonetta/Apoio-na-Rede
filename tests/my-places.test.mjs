import test from 'node:test';
import assert from 'node:assert/strict';
import { createMyPlacesHandler } from '../api/my-places.js';
import { createChangeRequestManagementHandler } from '../api/manage-change-requests.js';

const env = {SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const id = '00000000-0000-4000-8000-000000000001';
const timestamp = '2026-10-12T12:00:00.000Z';
const details = {nome:'Local de teste',categoria:'educacao',descricao:'Descrição adequada para o cadastro.',endereco:'Rua Teste, 10',bairro:'Centro',cidade:'Cataguases',estado:'MG',cep:'36770-000',latitude:-21.4,longitude:-42.7,fotos:[],telefone:'',whatsapp:'',horario_funcionamento:''};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function response() { return {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}}; }
async function run(handler, request={}) { const res=response();await handler({method:'GET',url:'/api/my-places',headers:{authorization:'Bearer valid-token',origin:env.APP_SITE_URL},...request},res);return res; }

test('my places requires a valid session before reading owner data', async () => {
  const calls=[];
  const handler=createMyPlacesHandler({env,fetchImpl:async (url,_options={}) => {calls.push(new URL(url));if (new URL(url).pathname === '/auth/v1/user') return json({message:'expired'},401);throw Error('unexpected');}});
  assert.equal((await run(handler,{headers:{authorization:'',origin:env.APP_SITE_URL}})).code,401);
  assert.equal((await run(handler)).code,401);
  assert.equal(calls.some(url => url.pathname.includes('my_establishments')),false);
});
test('my places identifies the missing database migration without exposing raw database errors', async () => {
  const handler=createMyPlacesHandler({env,fetchImpl:async rawUrl => {const url=new URL(rawUrl);if(url.pathname==='/auth/v1/user')return json({id:'user'});if(url.pathname==='/rest/v1/rpc/my_establishments_with_changes')return json({code:'PGRST202',message:'Could not find the function'},404);throw Error(`unexpected ${url.pathname}`);}});
  const result=await run(handler);
  assert.equal(result.code,503);
  assert.match(result.body.error,/establishment_change_requests\.sql/);
  assert.doesNotMatch(result.body.error,/Could not find/i);
});
test('owner can list only the database function result and submit a schema-validated change request', async () => {
  const calls=[];
  const handler=createMyPlacesHandler({env,fetchImpl:async (rawUrl,options={}) => {const url=new URL(rawUrl);calls.push({url,options});if(url.pathname==='/auth/v1/user')return json({id:'user'});if(url.pathname==='/rest/v1/rpc/my_establishments_with_changes')return json([{id,nome:'Meu local'}]);if(url.pathname==='/rest/v1/rpc/request_establishment_change')return json({id,status:'pendente'});throw Error(`unexpected ${url.pathname}`);}});
  const listed=await run(handler);assert.equal(listed.code,200);assert.equal(listed.body.places[0].id,id);
  const submitted=await run(handler,{method:'POST',body:{id,expectedUpdatedAt:timestamp,details}});assert.equal(submitted.code,201);
  const rpc=calls.find(call => call.url.pathname==='/rest/v1/rpc/request_establishment_change');assert.equal(JSON.parse(rpc.options.body).requested_establishment_id,id);
  assert.equal((await run(handler,{method:'POST',body:{id,expectedUpdatedAt:timestamp,details:{...details,estado:'ZZ'}}})).code,400);
});
test('change-request management is restricted to administrators and records an explicit decision', async () => {
  const calls=[];
  const handler=createChangeRequestManagementHandler({env,fetchImpl:async (rawUrl,options={}) => {const url=new URL(rawUrl);calls.push({url,options});if(url.pathname==='/auth/v1/user')return json({id:'admin'});if(url.pathname==='/rest/v1/rpc/is_site_admin')return json(true);if(url.pathname==='/rest/v1/rpc/admin_establishment_change_requests')return json([]);if(url.pathname==='/rest/v1/rpc/decide_establishment_change')return json(null);throw Error(`unexpected ${url.pathname}`);}});
  assert.equal((await run(handler,{url:'/api/manage-change-requests',headers:{authorization:'',origin:env.APP_SITE_URL}})).code,401);
  assert.equal((await run(handler,{url:'/api/manage-change-requests'})).code,200);
  const result=await run(handler,{method:'PATCH',url:'/api/manage-change-requests',body:{id,approve:false,reason:'Dados inconsistentes'}});assert.equal(result.code,200);
  const rpc=calls.find(call => call.url.pathname==='/rest/v1/rpc/decide_establishment_change');assert.deepEqual(JSON.parse(rpc.options.body),{request_id:id,approve:false,reason:'Dados inconsistentes'});
});
