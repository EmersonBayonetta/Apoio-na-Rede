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

let injection;
try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 // Geolocation and the routing service are simulated in the page; flags come from localStorage.
 injection = await send('Page.addScriptToEvaluateOnNewDocument',{source:`
  const geo = () => localStorage.getItem('test_geo');
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition(ok, fail) { setTimeout(() => geo() === 'denied' ? fail({ code: 1 }) : ok({ coords: { latitude: -21.39, longitude: -42.69, accuracy: 10 } }), 50); }, watchPosition(ok, fail) { this.getCurrentPosition(ok, fail); return 1; }, clearWatch() {} } });
  const originalFetch = window.fetch;
  window.fetch = (url, options) => String(url).includes('routing.openstreetmap.de')
   ? Promise.resolve(localStorage.getItem('test_route') === 'fail' ? new Response('', { status: 503 }) : new Response(JSON.stringify({ routes: [{ distance: 1234, duration: 900, geometry: { coordinates: [[-42.69, -21.39], [-42.6896, -21.3924]] } }] })))
   : originalFetch(url, options);
 `});
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

 // PRES-06, PRES-07, PRES-08, PRES-09: walking route on the place page
 const place = { id: 'est-r', nome: 'Biblioteca Municipal', categoria: 'educacao', endereco: 'Praça Teste, 1', cidade: 'Cataguases', estado: 'MG', latitude: -21.3924, longitude: -42.6896, descricao: 'Local de teste', fotos: [], status: 'pendente', nota_media: 0, total_avaliacoes: 0 };
 await evaluate(`localStorage.setItem('acessacidade_establishments', ${JSON.stringify(JSON.stringify([place]))});localStorage.setItem('acessacidade_criteria','[]')`);
 const routeSection = `document.querySelector('section[aria-labelledby="walking-route-title"]')`;
 const calculateRoute = async () => { await evaluate(`[...${routeSection}.querySelectorAll('button')].find(b=>b.textContent==='Calcular rota a pé').click()`); await pause(400); };
 const mapsLink = () => evaluate(`(()=>{const a=[...${routeSection}.querySelectorAll('a')].find(a=>a.textContent.includes('Abrir no Google Maps'));return a?new URL(a.href).searchParams.get('travelmode'):null})()`);
 await open('/?local=est-r');
 assert.equal(await mapsLink(), 'walking');
 await calculateRoute();
 assert.equal(await evaluate(`${routeSection}.querySelector('.walking-summary').textContent`), '1,2 km · 15 min');
 assert.equal(await evaluate(`${routeSection}.textContent.includes('Rota calculada pelo OpenStreetMap. Não verifica calçadas, rampas ou obstáculos.')`), true);
 await shot('mobile-route');
 for (const [flag, value, message] of [['test_geo', 'denied', 'Sem acesso à sua localização'], ['test_route', 'fail', 'Não foi possível calcular a rota agora']]) {
  await evaluate(`localStorage.setItem('${flag}','${value}')`); await open('/?local=est-r'); await calculateRoute();
  assert.ok((await evaluate(`${routeSection}.querySelector('[role="alert"]')?.textContent ?? ''`)).startsWith(message), message);
  assert.equal(await evaluate(`Boolean(${routeSection}.querySelector('.walking-summary'))`), false);
  assert.equal(await mapsLink(), 'walking');
  await evaluate(`localStorage.removeItem('${flag}')`);
 }
 // Result cards link to walking directions too
 await open('/');
 assert.ok(await evaluate(`[...document.querySelectorAll('main article a[href*="google.com/maps/dir"]')].every(a=>new URL(a.href).searchParams.get('travelmode')==='walking')`));

 console.log('presentation browser checks passed');
} finally {
 if (injection) await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 ws.close();
}
