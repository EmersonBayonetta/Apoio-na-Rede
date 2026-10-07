// Normal build on :4177; isolated Chrome on :9224. Supabase responses are simulated.
import assert from 'node:assert/strict';
const pages = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const ws = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);if(m.error) p.reject(m.error);else p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id,timer=setTimeout(()=>reject(Error(method)),15000);pending.set(requestId,{resolve,reject,timer});ws.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,700));
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4177'+path});await pause();};
const click=text=>evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}).click()`);
let injection;
try {
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
  localStorage.setItem('apoio_accessibility_onboarding_v1','completed');
  window.__writes=[];
  const original=window.fetch;
  window.fetch=(input,options={})=>{
   const url=String(input),json=data=>Promise.resolve(new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}}));
   if(url.includes('/auth/v1/user'))return json({id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{role:'admin'},user_metadata:{}});
   if(url.includes('/rest/v1/rpc/is_site_admin'))return json(true);
   if(url.includes('/rest/v1/routes')) {
    if(options.method==='POST'){const row=JSON.parse(options.body);window.__writes.push(row);return json({...row,id:'route-test',status:'pendente',auditada:false});}
    return json([]);
   }
   if(url.includes('/rest/v1/professionals') || url.includes('/rest/v1/establishments') || url.includes('/rest/v1/place_reports'))return json([]);
   return original(input,options);
  };
 `});
 await open('/?aba=rotas');await evaluate('localStorage.removeItem("sb-pwzqivjkpiqsizuebjlt-auth-token")');await open('/?aba=rotas');
 await click('Compartilhar um trecho');await pause();
 assert.ok(await evaluate(`document.body.innerText.includes('Entre para contribuir')`));
 assert.equal(await evaluate('window.__writes.length'),0);
 const payload=Buffer.from(JSON.stringify({sub:'00000000-0000-4000-8000-000000000001',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url');
 const session={access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.test`,refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',app_metadata:{role:'admin'},user_metadata:{}}};
 await evaluate(`localStorage.setItem('sb-pwzqivjkpiqsizuebjlt-auth-token',${JSON.stringify(JSON.stringify(session))})`);
 await open('/?aba=rotas');await click('Compartilhar um trecho');await pause();
 await evaluate(`(()=>{const form=[...document.querySelectorAll('form')].find(f=>f.elements.origin);for(const [name,value] of Object.entries({origin:'Praça',destination:'Biblioteca',city:'Cataguases',description:'Calçada observada'}))form.elements[name].value=value;form.requestSubmit();})()`);await pause();
 assert.equal(await evaluate('window.__writes.length'),1);
 assert.equal(await evaluate(`Object.hasOwn(window.__writes[0],'auditada')`),false);
 assert.equal(await evaluate(`Object.hasOwn(window.__writes[0],'status')`),false);
 assert.ok(await evaluate(`document.body.innerText.includes('Em verificação')`));
 await evaluate(`localStorage.setItem('acessacidade_routes',JSON.stringify([{id:'rot-1'}, {id:'old-real',ponto_origem:'Praça',ponto_destino:'Escola',cidade:'Cataguases',trecho_descricao:'Relato real',tem_rampa:false,tem_piso_tatil:false,tem_semaforo_sonoro:false,auditada:true,status:'verificado'}]));localStorage.setItem('acessacidade_professionals','[]')`);
 await evaluate(`document.querySelector('main details summary').click()`);
 await click('Carregar dados deste navegador');await pause();
 assert.ok(await evaluate(`document.body.innerText.includes('1 rotas e 0 profissionais.')`));
 await click('Enviar cadastros para revisão');await pause();
 assert.equal(await evaluate('window.__writes.length'),2);
 assert.equal(await evaluate('window.__writes[1].source_key'),'local:old-real');
 assert.equal(await evaluate(`Object.hasOwn(window.__writes[1],'auditada')`),false);
 await open('/gestao');
 await click('Rotas e profissionais');await pause();
 assert.ok(await evaluate(`document.body.innerText.includes('Rotas pendentes (0)') && document.body.innerText.includes('Profissionais pendentes (0)')`));
 console.log('PASS: online directory login, pending submission, stripped privileges, local import excludes mocks, admin queues.');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await send('Network.setBlockedURLs',{urls:[]});await evaluate('localStorage.clear()');ws.close();}
