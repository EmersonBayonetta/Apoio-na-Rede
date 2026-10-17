// Run Vite production preview on :4180 and isolated Chromium CDP on :9230.
import assert from 'node:assert/strict';
const targets = await (await fetch('http://127.0.0.1:9230/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));

const base = 'http://127.0.0.1:4180';
try {
 await send('Page.enable'); await send('Network.enable');
 await send('Network.setBlockedURLs', {urls: ['https://*']});
 await send('Page.navigate', {url: base}); await pause(1200);
 await evaluate("localStorage.setItem('apoio_accessibility_onboarding_v1','completed')");
 await evaluate('navigator.serviceWorker.ready.then(() => true)');
 await send('Page.reload'); await pause(700);
 assert.equal(await evaluate('Boolean(navigator.serviceWorker.controller)'), true, 'Service worker controls the app');
 const manifest = await (await fetch(base + '/site.webmanifest')).json();
 assert.equal(manifest.display, 'standalone');
 for (const icon of manifest.icons) {
   const bytes = Buffer.from(await (await fetch(base + icon.src)).arrayBuffer());
   assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
 }
 const installability = await send('Page.getInstallabilityErrors');
 assert.deepEqual(installability.installabilityErrors, [], 'Chromium installability requirements');
 for (const [width,height] of [[320,568],[390,844],[430,932],[844,390],[1024,768],[1440,900]]) {
   await send('Emulation.setDeviceMetricsOverride',{width,height,mobile:width<900,deviceScaleFactor:1});
   await pause(150);
   assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `No horizontal overflow at ${width}`);
   assert.equal(await evaluate("document.querySelector('.mobile-navigation').getBoundingClientRect().right <= innerWidth"), true);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,mobile:true,deviceScaleFactor:1});
 await evaluate("document.querySelector('.mobile-navigation button:nth-child(3)').click()"); await pause(200);
 assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Registration fits 320px');
 assert.equal(await evaluate("[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea')].filter(e=>e.getClientRects().length).every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)"), true, 'Mobile inputs avoid iOS zoom');
 await evaluate("document.querySelector('.mobile-navigation button:first-child').click()");
 // Exercise the browser event through React without depending on headless install UI.
 await evaluate("window.__installCalls=0; const e=new Event('beforeinstallprompt',{cancelable:true}); e.prompt=async()=>{window.__installCalls++}; e.userChoice=Promise.resolve({outcome:'dismissed'}); window.dispatchEvent(e)"); await pause(100);
 assert.equal(await evaluate("document.querySelector('.pwa-install-button')?.textContent"), 'Instalar app');
 await evaluate("document.querySelector('.pwa-install-button').click()"); await pause(100);
 assert.equal(await evaluate('window.__installCalls'), 1);
 assert.equal(await evaluate("document.querySelector('.pwa-install-button')===null"), true, 'Consumed prompt is removed');
 const workerTarget = (await (await fetch('http://127.0.0.1:9230/json/list')).json()).find(t=>t.type==='service_worker');
 const worker = new WebSocket(workerTarget.webSocketDebuggerUrl);
 await new Promise(resolve=>worker.onopen=resolve);
 const workerReply = new Promise(resolve=>worker.onmessage=resolve);
 worker.send(JSON.stringify({id:1,method:'Network.emulateNetworkConditions',params:{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0}}));
 await workerReply;
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await send('Page.navigate',{url:base+'/?aba=profissionais'}); await pause(1000);
 await send('Network.overrideNetworkState',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0,connectionType:'none'}); await pause(100);
 assert.equal(await evaluate("Boolean(document.querySelector('#root main'))"), true, 'App opens offline on a deep link');
 assert.equal(await evaluate("document.querySelector('.offline-notice')?.textContent.includes('sem conexão')"), true);
 const keys=await evaluate('caches.keys()'); assert.equal(keys.filter(k=>k.startsWith('apoio-pwa-')).length,1);
 const urls=await evaluate("(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith('apoio-pwa-')));return (await c.keys()).map(r=>r.url)})()");
 assert.equal(urls.some(url=>url.includes('/api/')||url.includes('supabase')),false,'No API or user responses in cache');
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 worker.close();
 console.log('PWA passed: installability, PNG sizes, responsive viewports, mobile forms, install action, offline deep link and cache isolation.');
} finally { ws.close(); }
