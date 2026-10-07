// Demo build :4176, Chrome CDP :9223. Providers and geolocation are simulated.
import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const message=JSON.parse(data);const request=pending.get(message.id);if(request){clearTimeout(request.timer);pending.delete(message.id);if(message.error)request.reject(message.error);else request.resolve(message.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(Error(method)),15000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const click=async label=>{await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!button)throw Error('Missing button');button.click();})()`);await pause(400);};
let injection;
try {
  await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
  injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__failPlaces=false;window.__routeFailure=false;
    const originalFetch=window.fetch;
    window.fetch=(url,options)=>String(url).includes('routing.openstreetmap.de')?Promise.resolve({ok:!window.__routeFailure,json:async()=>({routes:[{distance:1000,duration:600,geometry:{coordinates:[[-42.69,-21.39],[-42.68,-21.38]]}}]})}):originalFetch(url,options);
    Object.defineProperty(navigator,'geolocation',{value:{watchPosition:()=>1,clearWatch(){},getCurrentPosition:success=>success({coords:{latitude:-21.39,longitude:-42.69}})}});
    class Place {
      static async searchNearby(request){if(window.__failPlaces)throw Error('offline');const type=request.includedTypes[0];return {places:[{id:'external-'+type,displayName:'External '+type,formattedAddress:'Rua de teste, Cataguases',location:{lat:()=>-21.39,lng:()=>-42.69},types:[type]}]};}
      static async searchByText(){if(window.__failPlaces)throw Error('offline');return {places:[]};}
    }
    window.google={maps:{importLibrary:async()=>({Place,SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}})}};
  `});
  await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(1000);
  await evaluate("localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','[]')");
  await send('Page.reload');await pause(1400);
  assert.equal(await evaluate("[...document.querySelectorAll('article')].some(a=>a.innerText.includes('External'))"),true);
  for(const width of [1440,390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,mobile:width<1000,deviceScaleFactor:1});
    assert.equal(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'),true);
  }
  await evaluate("window.__failPlaces=true;document.querySelectorAll('.category-tile')[1].click()");await pause(600);
  assert.equal(await evaluate("document.body.innerText.includes('Tentar novamente')"),true);
  await evaluate('window.__failPlaces=false');await click('Tentar novamente');await pause(600);
  assert.equal(await evaluate("[...document.querySelectorAll('article')].some(a=>a.innerText.includes('External hospital'))"),true);
  await evaluate("[...document.querySelectorAll('article')].find(a=>a.innerText.includes('External hospital')).querySelector('button').click()");await pause(600);
  assert.equal(await evaluate("document.body.innerText.includes('Como chegar a pé')"),true);
  await click('Calcular rota a pé');
  assert.equal(await evaluate("!!document.querySelector('.walking-summary')"),true);
  await evaluate('window.__routeFailure=true');await click('Calcular rota a pé');
  assert.equal(await evaluate("[...document.querySelectorAll('[role=alert]')].some(e=>e.innerText.includes('Não foi possível calcular'))"),true);
  assert.equal(await evaluate("[...document.querySelectorAll('a')].some(a=>a.textContent.includes('Abrir no Google Maps')&&new URL(a.href).searchParams.get('travelmode')==='walking')"),true);
  await click('Voltar ao Explorar');await pause(400);
  await evaluate("document.querySelector('[aria-label=\"Mostrar filtros\"]').click()");await pause(100);
  await evaluate("document.querySelector('#advanced-search-filters input[type=checkbox]').click()");await pause(500);
  assert.equal(await evaluate("![...document.querySelectorAll('article')].some(a=>a.innerText.includes('External'))"),true);
  console.log('PASS public catalog: mobile layout, provider outage/retry, external detail, walking success/failure, Google fallback and verified filter');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await send('Network.setBlockedURLs',{urls:[]});ws.close();}
