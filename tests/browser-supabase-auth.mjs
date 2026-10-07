// Normal Supabase-enabled build, preview :4177, isolated Chrome CDP :9224.
// Auth responses are simulated; this does not send email or validate email delivery.
import assert from 'node:assert/strict';
const targets=await(await fetch('http://127.0.0.1:9224/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.error) p.reject(m.error); else p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id,timer=setTimeout(()=>reject(Error(method)),15000);pending.set(requestId,{resolve,reject,timer});ws.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4177'+path});await new Promise(r=>setTimeout(r,1300));};
let injection;
try {
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
  localStorage.setItem('apoio_accessibility_onboarding_v1','completed');
  window.__privateQueries=0;
  const original=window.fetch;
  window.fetch=(input,options)=>{
   const url=String(input);
   if(url.includes('/auth/v1/user'))return Promise.resolve(new Response(JSON.stringify({id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{role:'comum'},user_metadata:{role:'admin'}}),{status:200,headers:{'Content-Type':'application/json'}}));
   if(url.includes('/rest/v1/place_reports'))window.__privateQueries++;
   if(url.includes('/rest/v1/establishments'))return Promise.resolve(new Response('[]',{status:200,headers:{'Content-Type':'application/json'}}));
   return original(input,options);
  };
 `});
 await open('/gestao');
 assert.ok(await evaluate(`document.body.innerText.includes('Entre para acessar a gestão')`));
 assert.equal(await evaluate('window.__privateQueries'),0);
 const payload=Buffer.from(JSON.stringify({sub:'00000000-0000-4000-8000-000000000001',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url');
 const token=`eyJhbGciOiJIUzI1NiJ9.${payload}.test`;
 await evaluate(`localStorage.setItem('sb-pwzqivjkpiqsizuebjlt-auth-token',${JSON.stringify(JSON.stringify({access_token:token,refresh_token:'test-refresh-token',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{role:'comum'},user_metadata:{role:'admin'}}}))})`);
 await open('/gestao');
 assert.ok(await evaluate(`document.body.innerText.includes('Acesso não autorizado')`));
 assert.equal(await evaluate('window.__privateQueries'),0);
 assert.equal(await evaluate(`document.querySelector('meta[name="robots"]').content`),'noindex, nofollow');
 await open('/?aba=cadastro');
 assert.ok(await evaluate(`Boolean(document.querySelector('#est-nome'))`));
 await evaluate(`localStorage.removeItem('sb-pwzqivjkpiqsizuebjlt-auth-token')`);
 await open('/?aba=cadastro');
 assert.ok(await evaluate(`document.body.innerText.includes('Entre para contribuir')`));
 assert.equal(await evaluate(`Boolean(document.querySelector('#est-nome'))`),false);
 console.log('PASS: anonymous login gate, non-admin denied without querying reports, user_metadata cannot grant admin, responsible login gate.');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}
