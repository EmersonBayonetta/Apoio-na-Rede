// Normal build; public Supabase snapshot, isolated Chrome :9223 / preview :4176.
import assert from 'node:assert/strict';
import {loadEnv} from 'vite';
const env=loadEnv('development',process.cwd(),'VITE_');
const root=env.VITE_SUPABASE_URL;
const get=async table=>{const response=await fetch(`${root}/rest/v1/${table}`,{headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY}});assert.equal(response.status,200);return response.json();};
// Explicit public columns; private ownership fields are not fetched.
const places=await get('establishments?select=id,nome,categoria,endereco,bairro,cidade,estado,latitude,longitude,descricao,fotos,status,telefone,whatsapp,email_contato,website,horario_funcionamento,nota_media,total_avaliacoes,fonte_url,consultado_em,coordenadas_confirmadas&fonte_url=not.is.null');
const professionals=await get('professionals?select=id,nome,especialidade,registro_profissional,endereco,cidade,estado,telefone,email,whatsapp,atende_por_tipo,descricao,status,fonte_url,consultado_em');
const routes=await get('routes?select=id,titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,nivel_seguranca,coordenadas,distancia_metros,auditada,status,fonte_url,consultado_em');
assert.equal(places.length,9);assert.ok(professionals.length>=3);assert.ok(routes.length>=5);
assert.ok(places.every(place=>Number(place.nota_media)>=0&&Number(place.total_avaliacoes)>=0));
assert.ok(routes.filter(route=>route.fonte_url).every(route=>!route.auditada&&!route.tem_rampa&&!route.tem_piso_tatil&&!route.tem_semaforo_sonoro));
const tabs=await(await fetch('http://127.0.0.1:9223/json/list')).json();const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>ws.onopen=resolve);let id=0;const pending=new Map();
ws.onmessage=({data})=>{const r=JSON.parse(data);if(pending.has(r.id)){pending.get(r.id)(r.result);pending.delete(r.id);}};
const send=(method,params={})=>new Promise(resolve=>{const key=++id;pending.set(key,resolve);ws.send(JSON.stringify({id:key,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4176'+path});await pause(1400);};
let injection;
try{
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('apoio_accessibility_onboarding_v1','completed');const snapshots=${JSON.stringify({establishments:places,professionals,routes})};const originalFetch=window.fetch;window.fetch=(url,options)=>{const value=String(url);if(value.includes('/rest/v1/')){const table=value.split('/rest/v1/')[1].split('?')[0];return Promise.resolve(new Response(JSON.stringify(snapshots[table]||[]),{headers:{'Content-Type':'application/json'}}));}return originalFetch(url,options);};`});
 for(const width of [320,390,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1200});
  for(const path of ['/?aba=rotas','/?aba=profissionais','/?local='+places.find(place=>place.categoria==='servico_publico').id]){
   await open(path);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'no overflow '+width+' '+path);
   assert.equal(await evaluate(`document.querySelector('main').textContent.includes('fictício')`),false);
   if(path.includes('local=')){
    assert.equal(await evaluate(`Boolean(document.querySelector('section[aria-label="Fotos do Estabelecimento"]'))`),false);
    assert.ok(await evaluate(`Boolean(document.querySelector('.review-summary progress'))`));
    assert.ok(await evaluate(`Boolean(document.querySelector('a[href="mailto:administracao@cataguases.mg.gov.br"]'))`));
    const href=await evaluate(`document.querySelector('section[aria-labelledby="walking-route-title"] a').href`);
    assert.match(new URL(href).searchParams.get('destination'),/Praça Santa Rita/);
    assert.equal(await evaluate(`Boolean(document.querySelector('section[aria-labelledby="walking-route-title"] button'))`),false);
   }
  }
 }
 console.log('real catalog browser checks passed: public records, contacts, sources, real directions, removed gallery, review summary and 320/390/1440 layouts');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}
