import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminAccessHandler} from '../api/admin-access-request.js';
const id='00000000-0000-0000-0000-000000000099';
const env={SUPABASE_URL:'https://testproject.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',RESEND_API_KEY:'re_test',ADMIN_EMAIL_FROM:'Apoio <onboarding@resend.dev>'};
function response(){return {code:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
const req={method:'POST',headers:{authorization:'Bearer valid-token-with-at-least-20-characters'},body:{owner_email:'attacker@example.invalid',requester_email:'impersonated@example.invalid'}};
function mock({notified=false,emailStatus=200,notificationStatus='pendente'}={}) {
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/user'))return Response.json({id:'user-test',email_confirmed_at:'2026-10-07T00:00:00Z'});
  if(url.endsWith('/request_admin_access'))return Response.json({id,status:'pendente',notified});
  if(url.endsWith('/admin_access_notification'))return Response.json({id,status:notificationStatus,notified,requester_email:'verified@example.invalid',owner_email:'owner@example.invalid'});
  if(url==='https://api.resend.com/emails')return Response.json({id:'email-id'},{status:emailStatus});
  if(url.endsWith('/mark_admin_access_notified'))return Response.json(null);
  throw Error('Unexpected request');
 };
 return {calls,fetchImpl};
}
test('only verified requester can create a notification; recipient comes from private owner identity',async()=>{
 const m=mock(),res=response();await createAdminAccessHandler({env,fetchImpl:m.fetchImpl})(req,res);
 assert.equal(res.code,200);assert.equal(res.body.notified,true);
 const email=m.calls.find(c=>c.url==='https://api.resend.com/emails');
 const data=JSON.parse(email.options.body);
 assert.deepEqual(data.to,['owner@example.invalid']);assert.ok(data.text.includes('verified@example.invalid'));assert.ok(!data.text.includes('impersonated'));
 assert.ok(data.text.includes('/gestao?solicitacao='+id));assert.equal(email.options.headers['Idempotency-Key'],'admin-access/'+id);
 assert.equal(m.calls[0].options.headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);
 assert.ok(!JSON.stringify(res.body).includes('sb_secret'));
});
test('already notified requests do not send another email',async()=>{
 const m=mock({notified:true}),res=response();await createAdminAccessHandler({env,fetchImpl:m.fetchImpl})(req,res);
 assert.equal(res.code,200);assert.equal(m.calls.length,2);
});
test('a concurrent decision is returned without sending a stale notification or exposing the owner',async()=>{
 const m=mock({notificationStatus:'aprovado'}),res=response();await createAdminAccessHandler({env,fetchImpl:m.fetchImpl})(req,res);
 assert.equal(res.body.status,'aprovado');assert.equal(m.calls.length,3);assert.equal(res.body.owner_email,undefined);
});
test('missing Resend configuration retains pending request without claiming notification delivery',async()=>{
 const m=mock(),res=response();await createAdminAccessHandler({env:{...env,RESEND_API_KEY:''},fetchImpl:m.fetchImpl})(req,res);
 assert.equal(res.code,202);assert.equal(res.body.notified,false);assert.equal(m.calls.length,2);
});
test('provider failure never marks notification as sent',async()=>{
 const m=mock({emailStatus:403}),res=response();await createAdminAccessHandler({env,fetchImpl:m.fetchImpl})(req,res);
 assert.equal(res.code,202);assert.equal(res.body.notified,false);assert.ok(!m.calls.some(c=>c.url.endsWith('/mark_admin_access_notified')));
});
test('unauthenticated and unconfirmed accounts cannot request mail',async()=>{
 const res=response();await createAdminAccessHandler({env,fetchImpl:()=>{throw Error('Should not fetch');}})({method:'POST',headers:{}},res);assert.equal(res.code,401);
 const unconfirmed=response();await createAdminAccessHandler({env,fetchImpl:async()=>Response.json({id:'user-test',email_confirmed_at:null})})(req,unconfirmed);assert.equal(unconfirmed.code,401);
});
