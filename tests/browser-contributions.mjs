// Demo build, Vite preview :4176, Chrome CDP :9223.
import assert from 'node:assert/strict';
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve,reject) => { ws.onopen=resolve; ws.onerror=reject; });
let id=0; const pending=new Map();
ws.onmessage=({data})=>{ const msg=JSON.parse(data); const p=pending.get(msg.id); if(p) {clearTimeout(p.timer);pending.delete(msg.id);if(msg.error) p.reject(msg.error); else p.resolve(msg.result);} };
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;const timer=setTimeout(()=>reject(Error(method)),15000);pending.set(requestId,{resolve,reject,timer});ws.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4176'+path});await pause(1000);};
const click=async text=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.textContent.trim()===${JSON.stringify(text)}).click()`);await pause(350);};
try {
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
 await open('/');await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed')`);
 const place={id:'test-report-place',nome:'Local de contribuição',categoria:'educacao',endereco:'Rua Teste, 1',cidade:'Cataguases',estado:'MG',latitude:-21.39,longitude:-42.69,descricao:'Teste',fotos:[],status:'verificado',nota_media:0,total_avaliacoes:0};
 await evaluate(`localStorage.setItem('acessacidade_establishments',${JSON.stringify(JSON.stringify([place]))});localStorage.setItem('acessacidade_criteria','[]')`);
 await open('/?local=test-report-place');
 await click('Estive aqui, quero contribuir');
 assert.equal(await evaluate(`document.querySelectorAll('#contribution-title+form select').length || document.querySelectorAll('section[aria-labelledby="contribution-title"] select').length`),12);
 await evaluate(`(()=>{const e=document.querySelector('section[aria-labelledby="contribution-title"] select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'sim');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await evaluate(`(()=>{const input=document.querySelector('section[aria-labelledby="contribution-title"] input[type="file"]');const transfer=new DataTransfer();transfer.items.add(new File(['<svg/>'],'invalid.svg',{type:'image/svg+xml'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await click('Enviar relato');
 assert.ok(await evaluate(`document.body.innerText.includes('Use imagens JPG, PNG ou WebP')`));
 await evaluate(`(()=>{const input=document.querySelector('section[aria-labelledby="contribution-title"] input[type="file"]');const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array([137,80,78,71,13,10,26,10])],'test.png',{type:'image/png'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await click('Enviar relato');
 assert.ok(await evaluate(`document.body.innerText.includes('Você já relatou este local em')`));
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Estive aqui, quero contribuir')`),false);
 await open('/?local=test-report-place');
 assert.ok(await evaluate(`document.body.innerText.includes('Você já relatou este local em')`));
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('apoio_reports_v1')).length`),1);
 assert.ok(await evaluate(`JSON.parse(localStorage.getItem('apoio_reports_v1'))[0].fotos[0].startsWith('data:image/png')`));
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
 await open('/gestao');
 assert.equal(await evaluate(`document.querySelector('meta[name="robots"]').content`),'noindex, nofollow');
 assert.ok(await evaluate(`document.body.innerText.includes('Painel administrativo indisponível')`));
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Aprovar')`),false);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('apoio_reports_v1'))[0].status`),'pendente');
 // Seed approved fixtures to check public rendering; demo has no administrative bypass.
 await evaluate(`localStorage.setItem('apoio_reports_v1',JSON.stringify(JSON.parse(localStorage.getItem('apoio_reports_v1')).map(r=>({...r,status:'aprovado'}))));localStorage.setItem('acessacidade_establishments',${JSON.stringify(JSON.stringify([{...place,status:'verificado',informado_responsavel:true}]))})`);
 await open('/?local=test-report-place');
 assert.ok(await evaluate(`document.body.innerText.includes('Informado pelo responsável')`));
 assert.ok(await evaluate(`document.body.innerText.includes('Conferido')`));
 assert.equal(await evaluate(`document.querySelectorAll('section[aria-labelledby="approved-reports-title"] details').length`),1);
 await open('/');
 assert.equal(await evaluate(`Boolean(document.querySelector('a[href="/gestao"]'))`),false);
 console.log('PASS: duplicate UI, persistence, demo admin blocked, approved fixtures, owner seal, mobile width, noindex.');
} finally { ws.close(); }
