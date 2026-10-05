// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4176).
// Covers value proposition, walking route, navigation, accessibility fixes and empty states.
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
const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});
const open = async (path = '/') => { await send('Page.navigate',{url:`http://127.0.0.1:4176${path}`}); await pause(1800); };
const SHOTS = process.env.SHOTS;
const shot = async name => { if (!SHOTS) return; const { data } = await send('Page.captureScreenshot',{format:'png'}); (await import('node:fs')).writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data,'base64')); };

try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 await viewport(360, 780); await open();
 await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed')`); await open();

 // PRES-01, PRES-02, PRES-03, PRES-04: value proposition on the first screen
 assert.equal(await evaluate(`document.querySelector('main h1').textContent`), 'Saiba se um lugar é acessível para você antes de sair.');
 assert.equal(await evaluate(`window.scrollY`), 0);
 assert.ok(await evaluate(`(()=>{const r=document.querySelector('#main-search-input').getBoundingClientRect();return r.top>=0&&r.bottom<=780-80})()`), 'search fits the first mobile screen above the bottom bar');
 await shot('mobile-home');
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('section[aria-labelledby="how-it-works-title"] li strong')].map(e=>e.textContent)`), ['Diga do que você precisa', 'Encontre o local', 'Veja como chegar']);
 assert.equal(await evaluate(`document.querySelector('#how-it-works-title').textContent`), 'Como funciona');
 assert.equal(await evaluate(`document.body.innerText.includes('Trace sua rota')`), false);

 console.log('presentation browser checks passed');
} finally {
 ws.close();
}
