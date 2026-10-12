import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaceManagementHandler } from '../api/manage-places.js';
import { validatePlaceEdit } from '../api/_lib/placeManagementValidation.js';

const env = {SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const id = '00000000-0000-4000-8000-000000000001';
const timestamp = '2026-10-12T12:00:00+00:00';
const details = {nome:'Local de teste',categoria:'educacao',descricao:'Descrição',endereco:'Rua Teste, 10',bairro:'Centro',cidade:'Cataguases',estado:'MG',cep:'36770-000',latitude:-21.4,longitude:-42.7,fotos:[],telefone:'',whatsapp:'',horario_funcionamento:''};
const saved = {...details,id,status:'verificado',atualizado_em:timestamp};
const json = (data,status = 200,headers = {}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
const photo = `data:image/jpeg;base64,${Buffer.from([255,216,255,0,255,217]).toString('base64')}`;

function fixture({admin = true, authenticated = true, version = timestamp, concurrent = false, missing = false, failUpload = false} = {}) {
  const calls = [];
  const handler = createPlaceManagementHandler({env,fetchImpl:async (rawUrl,options = {}) => {
    const url = new URL(rawUrl);
    const call = {url,method:options.method ?? 'GET',headers:new Headers(options.headers),body:options.body};
    calls.push(call);
    if (url.pathname === '/auth/v1/user') return authenticated ? json({id,email:'admin@example.invalid',email_confirmed_at:timestamp}) : json({message:'expired'},401);
    if (url.pathname === '/rest/v1/rpc/is_site_admin') return json(admin);
    if (url.pathname === '/storage/v1/bucket/place-photos') return json({id:'place-photos',public:true});
    if (url.pathname.startsWith('/storage/v1/object/')) return json(failUpload ? {message:'Failed'} : {},failUpload ? 500 : 200);
    if (url.pathname === '/rest/v1/establishments') {
      if (call.method === 'PATCH') return json(concurrent ? null : {...saved,...JSON.parse(call.body)});
      if (url.searchParams.get('select') === 'id,atualizado_em') return json(missing ? [] : [{id,atualizado_em:version}]);
      return json(missing ? [] : [saved],200,{'Content-Range':'0-0/1'});
    }
    throw Error(`Unexpected request ${url}`);
  }});
  return {handler,calls};
}
async function run(handler,{method = 'GET',url = '/api/manage-places',authorization = 'Bearer valid-token',body,origin = env.APP_SITE_URL} = {}) {
  const res = {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
  await handler({method,url,headers:{authorization,origin},body},res);
  return res;
}

test('management rejects anonymous, expired, non-admin and foreign-origin requests before accessing places', async () => {
  for (const [config,request,code] of [
    [{},{authorization:''},401],[{authenticated:false},{},401],[{admin:false},{},403],[{},{origin:'https://foreign.invalid'},403],
  ]) {
    const {handler,calls} = fixture(config);
    assert.equal((await run(handler,request)).code,code);
    assert.equal(calls.some(call => call.url.pathname.includes('establishments') || call.url.pathname.includes('/storage/')),false);
  }
});
test('administrator can list and filter all statuses with pagination using their own JWT', async () => {
  const {handler,calls} = fixture();
  const result = await run(handler,{url:'/api/manage-places?q=Escola%25&status=pendente&page=1'});
  assert.equal(result.code,200);
  assert.equal(result.body.total,1);
  const query = calls.at(-1).url.searchParams;
  assert.equal(query.get('status'),'eq.pendente');
  assert.equal(query.get('offset'),'20');
  assert.equal(query.get('limit'),'20');
  assert.equal(query.get('nome'),'ilike.%Escola\\%%');
  assert.equal(calls.at(-1).headers.get('authorization'),'Bearer valid-token');
  assert.equal(calls.at(-1).headers.get('apikey'),env.SUPABASE_PUBLISHABLE_KEY);
});
test('editing keeps identity, publication and ratings out of the update and uses a version filter', async () => {
  const {handler,calls} = fixture();
  const result = await run(handler,{method:'PATCH',body:{id,expectedUpdatedAt:timestamp,details:{...details,nome:'Nome corrigido',status:'rejeitado',dono_id:'attacker',nota_media:5}}});
  assert.equal(result.code,200);
  const update = calls.find(call => call.method === 'PATCH');
  const payload = JSON.parse(update.body);
  assert.equal(payload.nome,'Nome corrigido');
  for (const key of ['id','status','dono_id','nota_media','total_avaliacoes']) assert.equal(Object.hasOwn(payload,key),false);
  assert.equal(update.url.searchParams.get('id'),`eq.${id}`);
  assert.equal(update.url.searchParams.get('atualizado_em'),`eq.${timestamp}`);
  assert.equal(update.headers.get('authorization'),'Bearer valid-token');
});
test('conflicting edit is rejected before upload; missing place cannot be saved', async () => {
  for (const [config,code] of [[{version:'2026-10-12T13:00:00Z'},409],[{missing:true},404]]) {
    const {handler,calls} = fixture(config);
    const result = await run(handler,{method:'PATCH',body:{id,expectedUpdatedAt:timestamp,details:{...details,fotos:[photo]}}});
    assert.equal(result.code,code);
    assert.equal(calls.some(call => call.method === 'PATCH' || call.url.pathname.includes('/storage/')),false);
  }
});
test('new file is stored as URL and cleaned up when an edit races with another update', async () => {
  for (const concurrent of [false,true]) {
    const {handler,calls} = fixture({concurrent});
    const result = await run(handler,{method:'PATCH',body:{id,expectedUpdatedAt:timestamp,details:{...details,fotos:[photo,'https://example.com/photo.jpg']}}});
    assert.equal(result.code,concurrent ? 409 : 200);
    const upload = calls.find(call => call.method === 'POST' && call.url.pathname.startsWith('/storage/v1/object/'));
    assert.equal(upload.headers.get('apikey'),env.SUPABASE_SECRET_KEY);
    const update = calls.find(call => call.method === 'PATCH');
    const photos = JSON.parse(update.body).fotos;
    assert.match(photos[0],/^https:\/\/test.supabase.co\/storage\/v1\/object\/public\/place-photos\//);
    assert.equal(photos[1],'https://example.com/photo.jpg');
    assert.equal(calls.some(call => call.method === 'DELETE'),concurrent);
  }
});
test('failed image upload never saves the edited place', async () => {
  const {handler,calls} = fixture({failUpload:true});
  const result = await run(handler,{method:'PATCH',body:{id,expectedUpdatedAt:timestamp,details:{...details,fotos:[photo]}}});
  assert.equal(result.code,503);
  assert.equal(calls.some(call => call.method === 'PATCH'),false);
});
test('malformed edits and searches are rejected without update or upload', async () => {
  const {handler,calls} = fixture();
  for (const change of [{nome:''},{estado:'ZZ'},{latitude:100},{fotos:['data:image/svg+xml;base64,YWJj']},{fotos:Array(11).fill('https://example.com/photo.jpg')},{telefone:'123'},{cep:'abc'}]) {
    assert.equal((await run(handler,{method:'PATCH',body:{id,expectedUpdatedAt:timestamp,details:{...details,...change}}})).code,400);
  }
  assert.equal((await run(handler,{method:'PATCH',body:{id,details}})).code,400);
  assert.equal((await run(handler,{url:'/api/manage-places?page=-1'})).code,400);
  assert.equal((await run(handler,{url:'/api/manage-places?status=anything'})).code,400);
  assert.equal((await run(handler,{url:'/api/manage-places?id=invalid'})).code,400);
  assert.equal(calls.some(call => call.method === 'PATCH' || call.url.pathname.includes('/storage/')),false);
  assert.equal(validatePlaceEdit({...details,nome:' Local ',estado:'mg'}).nome,'Local');
});
