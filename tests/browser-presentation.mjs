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

 // PRES-13, PRES-14, PRES-15: five destinations, distinct icons, readable labels
 await viewport(360, 780); await open('/');
 const mobileNav = `[...document.querySelectorAll('nav.mobile-navigation button')]`;
 assert.deepEqual(await evaluate(`${mobileNav}.map(b=>b.textContent.trim())`), ['Explorar', 'Rotas', 'Profissionais', 'Cadastrar', 'Minhas necessidades']);
 assert.equal(await evaluate(`new Set(${mobileNav}.map(b=>b.querySelector('svg').getAttribute('class'))).size`), 5);
 assert.ok(await evaluate(`${mobileNav}.every(b=>parseFloat(getComputedStyle(b.querySelector('span')).fontSize)>=12)`));
 await viewport(1280, 900); await open('/');
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('nav.desktop-navigation button')].map(b=>b.textContent.trim())`), ['Explorar', 'Rotas acessíveis', 'Profissionais', 'Cadastrar local', 'Minhas necessidades']);

 // PRES-16, PRES-17, PRES-18: tabs in the url, reload and back
 const heading = () => evaluate(`document.querySelector('main h1')?.textContent`);
 await evaluate(`[...document.querySelectorAll('nav.desktop-navigation button')].find(b=>b.textContent.trim()==='Rotas acessíveis').click()`); await pause(500);
 assert.equal(await evaluate('location.search'), '?aba=rotas');
 assert.equal(await heading(), 'Trechos e rotas acessíveis');
 await send('Page.reload'); await pause(1800);
 assert.equal(await heading(), 'Trechos e rotas acessíveis');
 await evaluate('history.back()'); await pause(800);
 assert.equal(await evaluate('location.search'), '');
 assert.equal(await heading(), 'Saiba se um lugar é acessível para você antes de sair.');
 for (const [aba, expected] of [['profissionais', 'Profissionais preparados para atender'], ['cadastro', 'Informe os recursos de acessibilidade'], ['xyz', 'Saiba se um lugar é acessível para você antes de sair.']]) {
  await open(`/?aba=${aba}`); assert.equal(await heading(), expected, aba);
 }
 await open('/?aba=rotas&local=est-r');
 assert.equal(await heading(), 'Biblioteca Municipal');

 // PRES-19, PRES-20: needs dialog and display options link to each other
 await open('/');
 const dialogTitle = () => evaluate(`document.querySelector('[role="dialog"] #pref-modal-title')?.textContent.trim() ?? null`);
 const panelOpen = () => evaluate(`Boolean(document.querySelector('#accessibility-menu'))`);
 await evaluate(`[...document.querySelectorAll('nav.desktop-navigation button')].find(b=>b.textContent.trim()==='Minhas necessidades').click()`); await pause(300);
 assert.equal(await dialogTitle(), 'Minhas necessidades');
 await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find(b=>b.textContent.trim()==='Opções de exibição e leitura').click()`); await pause(300);
 assert.equal(await dialogTitle(), null);
 assert.equal(await panelOpen(), true);
 await evaluate(`[...document.querySelectorAll('#accessibility-menu button')].find(b=>b.textContent.trim()==='Minhas necessidades').click()`); await pause(300);
 assert.equal(await panelOpen(), false);
 assert.equal(await dialogTitle(), 'Minhas necessidades');
 await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find(b=>b.textContent.trim()==='Cancelar').click()`); await pause(200);

 // PRES-10, PRES-11, PRES-12: named filter, 24 px targets, launcher clear of controls
 const smallTargets = `(()=>{const inline=e=>{const p=e.closest('p');return p&&p.textContent.trim()!==e.textContent.trim()};
  return [...document.querySelectorAll('a,button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!inline(e)).filter(e=>{const r=e.getBoundingClientRect();return r.width<24||r.height<24}).map(e=>(e.textContent.trim()||e.getAttribute('aria-label'))+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))})()`;
 const launcherOverlaps = `(()=>{window.scrollTo(0,document.documentElement.scrollHeight);const l=document.querySelector('[aria-controls="accessibility-menu"]').getBoundingClientRect();
  return [...document.querySelectorAll('a,button')].filter(e=>!e.closest('.accessibility-launcher')&&e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<l.right&&r.right>l.left&&r.top<l.bottom&&r.bottom>l.top}).map(e=>e.textContent.trim())})()`;
 for (const [width, height] of [[360, 780], [1280, 900]]) {
  await viewport(width, height);
  for (const path of ['/', '/?aba=rotas', '/?aba=profissionais']) {
   await open(path);
   assert.deepEqual(await evaluate(smallTargets), [], `targets ${width} ${path}`);
   assert.deepEqual(await evaluate(launcherOverlaps), [], `launcher ${width} ${path}`);
   await pause(200);
  }
 }
 await open('/?aba=profissionais');
 assert.equal(await evaluate(`[...document.querySelectorAll('main select')].map(e=>e.getAttribute('aria-label')).join()`), 'Filtrar por necessidade atendida');
 await open('/?local=est-r');
 assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Educação')`), true);

 // PRES-21, PRES-22: empty community screens invite the first contribution
 await evaluate(`localStorage.removeItem('acessacidade_routes');localStorage.removeItem('acessacidade_professionals')`);
 for (const [aba, message, button] of [['rotas', 'Ainda não há trechos compartilhados.', 'Compartilhar um trecho'], ['profissionais', 'Ainda não há profissionais cadastrados.', 'Cadastrar profissional']]) {
  await open(`/?aba=${aba}`);
  assert.equal(await evaluate(`document.querySelector('main .empty-state p').textContent`), message);
  await evaluate(`[...document.querySelectorAll('main .empty-state button')].find(b=>b.textContent.trim()===${JSON.stringify(button)}).click()`); await pause(300);
  assert.equal(await evaluate(`Boolean(document.querySelector('main form'))`), true, aba + ' form opens');
  await evaluate(`(()=>{const i=document.querySelector('main input[placeholder^="Buscar"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'xyz');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await pause(200);
  assert.equal(await evaluate(`document.querySelector('main .empty-state p').textContent`), 'Nenhum resultado para essa busca.');
 }

 // PRES-23: when Google places fail and nothing else is listed, explain and offer retry only
 await evaluate(`localStorage.removeItem('acessacidade_establishments')`);
 await open('/');
 const unavailable = `document.querySelector('main .places-unavailable')`;
 assert.equal(await evaluate(`${unavailable}?.querySelector('h2').textContent`), 'Os locais próximos não carregaram.');
 assert.deepEqual(await evaluate(`[...${unavailable}.querySelectorAll('button')].map(b=>b.textContent.trim())`), ['Tentar novamente']);
 assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Limpar filtros')`), false);

 console.log('presentation browser checks passed');
} finally {
 if (injection) await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 ws.close();
}
