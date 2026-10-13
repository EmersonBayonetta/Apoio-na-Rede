// Run against an isolated Chrome profile (CDP :9222) and Vite preview (:4173).
// External requests are blocked: these checks cover local behavior, not providers.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = targets.find(target => target.type === 'page');
if (!page) throw Error('Nenhuma página do Chrome está disponível para o teste.');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds));
const click = async text => { await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}&&e.getClientRects().length);if(!e)throw Error('Missing button: '+${JSON.stringify(text)});e.click()})()`); await pause(150); };
const results = [];
const check = async (name, expression) => { assert.equal(await evaluate(expression), true, name); results.push(name); console.log('PASS',name); };
const resize = async (width,height) => { await send('Emulation.setDeviceMetricsOverride',{width,height,mobile:width<1024,deviceScaleFactor:1});await pause(150); };
const open = async path => { await send('Page.navigate',{url:`http://127.0.0.1:4173${path}`}); await pause(900); };

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs',{urls:['https://*']});
  await resize(320,800); await open('/');
  await evaluate('localStorage.clear()'); await send('Page.reload'); await pause(700);
  await check('boas-vindas cabe em 320 px', 'document.documentElement.scrollWidth<=document.documentElement.clientWidth && document.body.innerText.includes("Como você quer começar?")');
  await click('Continuar sem se cadastrar');
  await check('visitante vê somente navegação pública', `(()=>{const t=document.body.innerText;return t.includes('Explorar')&&t.includes('Profissionais')&&t.includes('Minhas necessidades')&&!t.includes('Cadastrar local')})()`);
  await check('exploração pública permanece sem rolagem horizontal', 'document.documentElement.scrollWidth<=document.documentElement.clientWidth');
  await open('/?aba=cadastro');
  await check('rota de cadastro não expõe formulário ao visitante', `!document.querySelector('#est-nome')`);
  await resize(1366,600); await open('/'); await click('Continuar sem se cadastrar');
  await evaluate(`document.querySelector('.accessibility-launcher button').click()`); await click('Extra');
  await check('painel Extra cabe no desktop baixo', `document.querySelector('#accessibility-menu').getBoundingClientRect().top>=0`);
  await click('Amarelo/Preto'); await pause(300);
  await check('alto contraste é aplicado', `document.body.classList.contains('theme-yellow-black')&&[...document.querySelectorAll('#accessibility-menu button')].find(e=>e.textContent.includes('Amarelo/Preto')).getAttribute('aria-pressed')==='true'`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await pause(100);
  await check('Escape fecha o painel e devolve o foco', `!document.querySelector('#accessibility-menu')&&document.activeElement===document.querySelector('.accessibility-launcher button')`);
  fs.mkdirSync('docs/auditoria-desktop-mobile',{recursive:true});
  fs.writeFileSync('docs/auditoria-desktop-mobile/regressions-fixed.json',JSON.stringify({date:new Date().toISOString().slice(0,10),environment:'Chrome emulado; APIs externas bloqueadas',passed:results},null,2));
} finally { ws.close(); }
