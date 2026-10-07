// Normal build :4177, isolated Chrome :9224. Simulated API and Auth; sends no email.
import assert from 'node:assert/strict';
const targets=await(await fetch('http://127.0.0.1:9224/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id,timer=setTimeout(()=>reject(Error(method)),15000);pending.set(requestId,{resolve,reject,timer});ws.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4177'+path});await new Promise(r=>setTimeout(r,1300));};
const click=text=>evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}).click()`);
let injection;
try {
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
  localStorage.setItem('apoio_accessibility_onboarding_v1','completed');
  window.__requests=0;window.__decisions=[];window.__privateQueries=0;
  let list=[{id:'00000000-0000-0000-0000-000000000099',email:'team@example.invalid',requested_at:'2026-10-07T00:00:00Z',notified:true}];
  const original=window.fetch,owner=localStorage.getItem('test-role')==='owner';
  window.fetch=(input,options={})=>{
   const url=String(input),json=data=>Promise.resolve(Response.json(data));
   if(url.includes('/auth/v1/user'))return json({id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{},user_metadata:{}});
   if(url.includes('/rpc/is_site_admin')||url.includes('/rpc/is_site_owner'))return json(owner);
   if(url.includes('/rpc/my_admin_access_request'))return json(null);
   if(url.includes('/api/admin-access-request')){window.__requests++;window.__authorization=options.headers.Authorization;return json({id:'request-test',status:'pendente',notified:true});}
   if(url.includes('/rpc/list_admin_access_requests'))return json(list);
   if(url.includes('/rpc/decide_admin_access_request')){window.__decisions.push(JSON.parse(options.body));list=[];return json(null);}
   if(url.includes('/rest/v1/place_reports')||url.includes('/rest/v1/establishments')){window.__privateQueries++;return json([]);}
   return original(input,options);
  };
 `});
 await open('/gestao');
 const payload=Buffer.from(JSON.stringify({sub:'00000000-0000-4000-8000-000000000001',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url');
 const session={access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.test`,refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{},user_metadata:{}}};
 await evaluate(`localStorage.setItem('sb-pwzqivjkpiqsizuebjlt-auth-token',${JSON.stringify(JSON.stringify(session))});localStorage.removeItem('test-role')`);
 await open('/gestao');
 assert.ok(await evaluate(`document.body.innerText.includes('Solicitar acesso administrativo')`));
 assert.equal(await evaluate('window.__privateQueries'),0);
 await click('Solicitar acesso');await new Promise(r=>setTimeout(r,300));
 assert.equal(await evaluate('window.__requests'),1);
 assert.ok(await evaluate(`window.__authorization.startsWith('Bearer ')`));
 assert.ok(await evaluate(`document.body.innerText.includes('Sua solicitação aguarda análise.')`));
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(e=>e.textContent==='Autorizar acesso')`),false);
 await evaluate(`localStorage.setItem('test-role','owner')`);
 await open('/gestao?solicitacao=00000000-0000-0000-0000-000000000099');
 assert.ok(await evaluate(`document.body.innerText.includes('team@example.invalid')`));
 await click('Autorizar acesso');await new Promise(r=>setTimeout(r,300));
 assert.deepEqual(await evaluate('window.__decisions'),[{request_id:'00000000-0000-0000-0000-000000000099',approve:true}]);
 assert.ok(await evaluate(`document.body.innerText.includes('Acesso administrativo autorizado.')`));
 console.log('PASS: requester sends authenticated request, cannot view internal queues or approve, owner reviews via email link.');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await evaluate('localStorage.clear()');await send('Network.setBlockedURLs',{urls:[]});ws.close();}
