import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdministratorLoginHandler} from '../api/administrator-login.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',APP_SITE_URL:'https://apoio-na-rede.vercel.app'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const run=async(handler,{email='invited@example.invalid',method='POST',origin=env.APP_SITE_URL}={})=>{
 const res={status(code){this.code=code;return this;},setHeader(){},json(body){this.body=body;return this;}};
 await handler({method,headers:{origin},body:{email,create_user:true,redirect:'https://attacker.invalid'}},res);return res;
};
test('administrator login creates accounts only for a database-approved invitation and uses the canonical redirect',async()=>{
 for(const invited of [false,true]){
  const calls=[];
  const handler=createAdministratorLoginHandler({env,fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body),headers:options.headers});return json(url.includes('/rpc/')?{allowed:true,create_user:invited}:{});}});
  assert.equal((await run(handler)).code,200);
  assert.equal(calls[1].body.create_user,invited);
  assert.equal(calls[0].headers.apikey,env.SUPABASE_SECRET_KEY);
  assert.equal(calls[1].headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);
  assert.equal(new URL(calls[1].url).searchParams.get('redirect_to'),`${env.APP_SITE_URL}/gestao`);
 }
});
test('unlisted email never creates an account or sends mail',async()=>{
 const calls=[];const handler=createAdministratorLoginHandler({env,fetchImpl:async(url)=>{calls.push(url);return json({allowed:false});}});
 assert.equal((await run(handler)).code,200);assert.equal(calls.length,1);
});
test('login returns mail failures without claiming delivery and rejects invalid input and origin',async()=>{
 for(const [status,body,expected] of [[429,{code:'over_email_send_rate_limit'},429],[400,{code:'email_address_not_authorized'},503]]){
  const handler=createAdministratorLoginHandler({env,fetchImpl:async(url)=>url.includes('/rpc/')?json({allowed:true,create_user:true}):json(body,status)});
  const result=await run(handler);assert.equal(result.code,expected);assert.ok(result.body.error);
 }
 const handler=createAdministratorLoginHandler({env,fetchImpl:async()=>{throw Error('Unexpected');}});
 assert.equal((await run(handler,{origin:'https://attacker.invalid'})).code,403);
 assert.equal((await run(handler,{email:'invalid'})).code,400);
 assert.equal((await run(handler,{method:'GET'})).code,405);
});
