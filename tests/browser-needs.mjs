// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4176).
// Covers requirement profile editing and place compatibility.
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
const section = `document.querySelector('[role="dialog"] section[aria-labelledby="requirements-title"]')`;
const chooseLevel = (resource, level) => evaluate(`[...${section}.querySelectorAll('fieldset')].find(f=>f.querySelector('legend').textContent===${JSON.stringify(resource)}).querySelectorAll('label').forEach(l=>{if(l.textContent.trim()===${JSON.stringify(level)})l.querySelector('input').click()})`);
const checkedLevels = () => evaluate(`Object.fromEntries([...${section}.querySelectorAll('fieldset')].map(f=>[f.querySelector('legend').textContent,[...f.querySelectorAll('label')].find(l=>l.querySelector('input').checked)?.textContent.trim()]))`);
const storedRequirements = () => evaluate(`JSON.parse(localStorage.getItem('apoio_requirements_v1'))`);
const openSettings = async () => { await clickButton('Ajustes'); await pause(300); };
const reload = async () => { await send('Page.reload'); await pause(1500); };
const place = (id, nome) => ({ id, nome, categoria: 'alimentacao', endereco: 'Rua Teste, 1', cidade: 'Cataguases', estado: 'MG', latitude: -21.3924, longitude: -42.6896, descricao: 'Local de teste', fotos: [], status: 'pendente', nota_media: 0, total_avaliacoes: 0 });
const criterion = (establishment_id, recurso, presente) => ({ id: `${establishment_id}-${recurso}`, establishment_id, tipo_deficiencia: 'mobilidade', criterio: recurso, recurso, presente });
const seed = (requirements) => evaluate(`localStorage.setItem('acessacidade_establishments', ${JSON.stringify(JSON.stringify([place('est-a', 'Café Acessível'), place('est-b', 'Bar Degrau')]))});
 localStorage.setItem('acessacidade_criteria', ${JSON.stringify(JSON.stringify([...['rampa', 'elevador', 'corrimao', 'libras'].map(id => criterion('est-a', id, true)), criterion('est-a', 'banheiro_pcd', null), criterion('est-b', 'rampa', false)]))});
 localStorage.setItem('apoio_requirements_v1', ${JSON.stringify(JSON.stringify(requirements))});`);
const openPlace = async id => { await send('Page.navigate',{url:`http://127.0.0.1:4176/?local=${id}`}); await pause(2000); };
const match = `document.querySelector('main section[aria-label="Compatibilidade com seus requisitos"]')`;
const matchGroup = title => evaluate(`(()=>{const heading=[...${match}.querySelectorAll('h4')].find(h=>h.textContent===${JSON.stringify(title)});return heading?[...heading.nextElementSibling.querySelectorAll('li')].map(li=>li.textContent):null;})()`);
const profile = { rampa: 'indispensavel', elevador: 'desejavel', corrimao: 'desejavel', libras: 'desejavel', banheiro_pcd: 'indispensavel' };

try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(2500);
 await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed')`);
 await reload();

 // COMP-01, COMP-05: 12 resources, 3 levels, "Não preciso" by default, no disability question
 await openSettings();
 const defaults = await checkedLevels();
 assert.equal(Object.keys(defaults).length, 12);
 assert.ok(Object.values(defaults).every(level => level === 'Não preciso'));
 assert.equal(await evaluate(`[...${section}.querySelectorAll('fieldset')].every(f=>[...f.querySelectorAll('label')].map(l=>l.textContent.trim()).join('|')==='Indispensável|Desejável|Não preciso')`), true);
 assert.equal(await evaluate(`[...${section}.querySelectorAll('input')].every(input=>input.type==='radio'&&input.name.startsWith('requirement-'))`), true);
 assert.equal(await evaluate(`${section}.querySelector('[role="checkbox"]')`), null);

 // COMP-02: saved levels survive a reload
 await chooseLevel('Banheiro PCD', 'Indispensável');
 await chooseLevel('Área de descanso ou espaço tranquilo', 'Desejável');
 await clickButton('Salvar Preferências'); await pause(300);
 assert.deepEqual(await storedRequirements(), { banheiro_pcd: 'indispensavel', area_descanso: 'desejavel' });
 await reload(); await openSettings();
 const restored = await checkedLevels();
 assert.equal(restored['Banheiro PCD'], 'Indispensável');
 assert.equal(restored['Área de descanso ou espaço tranquilo'], 'Desejável');
 assert.equal(Object.values(restored).filter(level => level === 'Não preciso').length, 10);

 // COMP-03: clearing returns every resource to "Não preciso"
 await clickButton('Limpar requisitos'); await pause(200);
 assert.ok(Object.values(await checkedLevels()).every(level => level === 'Não preciso'));
 await clickButton('Salvar Preferências'); await pause(300);
 assert.deepEqual(await storedRequirements(), {});
 await reload(); await openSettings();
 assert.ok(Object.values(await checkedLevels()).every(level => level === 'Não preciso'));
 await clickButton('Cancelar'); await pause(200);
 // COMP-06, COMP-07, COMP-10, COMP-12: comparison on the place page
 await seed(profile); await openPlace('est-a');
 assert.equal(await evaluate(`${match}.querySelector('p').textContent`), 'Atende 4 de 5 requisitos');
 assert.deepEqual(await matchGroup('Atendidos'), ['Atendimento em Libras', 'Rampa (indispensável)', 'Elevador', 'Corrimão']);
 assert.deepEqual(await matchGroup('Sem informação'), ['Banheiro PCD (indispensável)']);
 assert.equal(await matchGroup('Não atendidos'), null);
 assert.equal(await evaluate(`${match}.textContent.includes('Requisito indispensável não atendido')`), false);
 assert.equal(await evaluate(`${match}.textContent.includes('Comparação com as informações cadastradas. Não é uma certificação de acessibilidade.')`), true);

 // COMP-09: an essential marked as no is highlighted
 await openPlace('est-b');
 assert.equal(await evaluate(`${match}.querySelector('p').textContent`), 'Atende 0 de 5 requisitos');
 assert.equal(await evaluate(`[...${match}.querySelectorAll('p')].some(p=>p.textContent==='Requisito indispensável não atendido: Rampa')`), true);
 assert.deepEqual(await matchGroup('Não atendidos'), ['Rampa (indispensável)']);

 // COMP-11: no comparison without requirements
 await seed({}); await openPlace('est-a');
 assert.equal(await evaluate(`Boolean(${match})`), false);
 assert.equal(await evaluate(`document.querySelector('main h1')?.textContent.includes('Café Acessível') ?? false`), true);
 console.log('needs compatibility browser checks passed');
} finally {
 ws.close();
}
