// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4176).
// Covers the community directory forms: validation alerts, saved items and WhatsApp links.
import assert from 'node:assert/strict';
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const clickButton = text => evaluate(`[...document.querySelectorAll('button')].find(e=>e.offsetParent&&e.textContent.trim()===${JSON.stringify(text)}).click()`);
const fill = values => evaluate(`(()=>{const form=document.querySelector('main form');for(const [name,value] of Object.entries(${JSON.stringify(values)}))form.elements[name].value=value;form.requestSubmit();})()`);
const alertText = () => evaluate(`document.querySelector('main form [role="alert"]')?.textContent ?? null`);
const article = name => `[...document.querySelectorAll('main article')].find(e=>e.querySelector('h2')?.textContent===${JSON.stringify(name)})`;

try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(2500);
 await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed')`);
 await send('Page.reload');await pause(1500);

 await clickButton('Profissionais');await pause(300);
 await clickButton('Cadastrar profissional');await pause(200);
 await fill({name:'Ana Teste',specialty:'Fisioterapia',city:'Cataguases',state:'zz',phone:'',whatsapp:''});await pause(200);
 assert.equal(await alertText(),'Informe uma UF válida.');
 assert.equal(await evaluate(`Boolean(${article('Ana Teste')})`),false);

 await fill({state:'mg',phone:'0800 770 7722'});await pause(300);
 assert.equal(await evaluate(`Boolean(${article('Ana Teste')})`),true);
 assert.equal(await evaluate(`${article('Ana Teste')}.textContent.includes('Cataguases – MG')`),true);
 assert.equal(await evaluate(`${article('Ana Teste')}.querySelector('a[href^="https://wa.me"]')`),null);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('acessacidade_professionals')||'[]').find(p=>p.nome==='Ana Teste')?.whatsapp`),'');

 await clickButton('Cadastrar profissional');await pause(200);
 await fill({name:'Bia Teste',specialty:'Odontologia',city:'Cataguases',state:'MG',phone:'',whatsapp:'(32) 98765-4321'});await pause(300);
 assert.equal(await evaluate(`${article('Bia Teste')}.querySelector('a[href^="https://wa.me"]').href`),'https://wa.me/5532987654321');

 await clickButton('Cadastrar profissional');await pause(200);
 await fill({name:'Clínica São José',specialty:'Fisioterapia',city:'Cataguases',state:'MG',phone:'',whatsapp:''});await pause(300);
 assert.equal(await evaluate(`${article('Clínica São José')}.querySelectorAll('a[href^="tel:"], a[href^="https://wa.me"]').length`),0);
 await evaluate(`(()=>{const input=document.querySelector('main input[placeholder^="Buscar"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'CLINICA   sao');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await pause(200);
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('main article h2')].map(e=>e.textContent)`),['Clínica São José']);

 await clickButton('Rotas acessíveis');await pause(300);
 const routesBefore = await evaluate(`document.querySelectorAll('main article').length`);
 await clickButton('Compartilhar um trecho');await pause(200);
 await fill({origin:'Praça',destination:'   ',city:'Cataguases',description:'Calçada regular'});await pause(200);
 assert.equal(await alertText(),'Preencha partida, destino, cidade e condições observadas.');
 assert.equal(await evaluate(`document.querySelectorAll('main article').length`),routesBefore);
 console.log('community directory browser checks passed');
} finally {
 ws.close();
}
