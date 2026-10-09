import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewHandler} from '../api/review.js';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'test-server-secret',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const body={visitorId:'00000000-0000-4000-8000-000000000001',establishment_id:'00000000-0000-4000-8000-000000000002',nota:5,comentario:'Bom atendimento',tipo_deficiencia_avaliada:'mobilidade'};
async function invoke(input,fetchImpl){const res={code:0,setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};await createReviewHandler({env,fetchImpl})({method:'POST',headers:{origin:env.APP_SITE_URL},body:input},res);return res;}
test('visitor review has no auth/email calls and sends only whitelisted fields with a private identity hash',async()=>{
 const calls=[];const result=await invoke({...body,user_nome:'Admin',user_id:'fake',denunciada:true},async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify({id:'saved'}));});
 assert.equal(result.code,201);assert.equal(calls.length,1);assert.match(calls[0].url,/rpc\/submit_visitor_review$/);assert.match(calls[0].body.visitor_hash,/^[a-f0-9]{64}$/);assert.notEqual(calls[0].body.visitor_hash,body.visitorId);assert.deepEqual(Object.keys(calls[0].body.details).sort(),['comentario','establishment_id','nota','tipo_deficiencia_avaliada']);
});
test('duplicate is 409; status reads do not submit another review',async()=>{
 assert.equal((await invoke(body,async()=>new Response(JSON.stringify({code:'23505'}),{status:409}))).code,409);
 const result=await invoke({...body,checkOnly:true},async url=>{assert.match(url,/has_visitor_review$/);return new Response('true');});assert.deepEqual(result.data,{reviewed:true});
});
test('invalid review identity is rejected before database access',async()=>{
 const result=await invoke({...body,visitorId:'invalid'},async()=>{throw Error('Unexpected call');});assert.equal(result.code,400);
});

test('map places publish without a registered establishment and use the external identity for status',async()=>{
 const calls=[];
 const external={...body,establishment_id:'external-google-ChIJtest',external_place_id:'ChIJtest'};
 const saved=await invoke(external,async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify({id:'saved',external_place_id:'ChIJtest'}));});
 assert.equal(saved.code,201);
 assert.match(calls[0].url,/submit_external_visitor_review$/);
 assert.equal(calls[0].body.details.external_place_id,'ChIJtest');
 assert.equal(Object.hasOwn(calls[0].body.details,'establishment_id'),false);
 const status=await invoke({...external,checkOnly:true},async(url,options)=>{assert.match(url,/has_external_visitor_review$/);assert.equal(JSON.parse(options.body).place_id,'ChIJtest');return new Response('true');});
 assert.deepEqual(status.data,{reviewed:true});
});

test('map review identifiers are validated before database access',async()=>{
 const result=await invoke({...body,external_place_id:'bad/id?query'},async()=>{throw Error('Unexpected call');});
 assert.equal(result.code,400);
});
