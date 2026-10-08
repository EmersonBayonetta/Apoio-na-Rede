// Isolated fixtures in Chrome :9223 against the normal preview :4176. No writes or email.
import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.onopen=resolve);
let sequence=0;const pending=new Map();
socket.onmessage=({data})=>{const event=JSON.parse(data);if(pending.has(event.id)){pending.get(event.id)(event.result);pending.delete(event.id);}};
const send=(method,params={})=>new Promise(resolve=>{const id=++sequence;pending.set(id,resolve);socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert.equal(result.exceptionDetails,undefined);return result.result.value;};
const places=Array.from({length:9},(_,index)=>({id:`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`,nome:`Local de teste ${index+1}`,categoria:'servico_publico',endereco:'Rua de teste, 10',cidade:'Cataguases',estado:'MG',latitude:-21.39,longitude:-42.69,coordenadas_confirmadas:false,descricao:'Fixture isolada',status:'verificado',fotos:[],criteria:[],reviews:Array.from({length:8},(_,review)=>({id:`review-${review}`,user_nome:`Pessoa ${review}`,nota:5,comentario:`Comentário de teste ${review}`,tipo_deficiencia_avaliada:'mobilidade',data:'08/10/2026'}))}));
const professionals=[{id:'presencial',nome:'Profissional presencial',especialidade:'Teste',endereco:'Rua de teste, 20',cidade:'Cataguases',estado:'MG',descricao:'Presencial e online',atende_por_tipo:[]},{id:'online',nome:'Profissional online',especialidade:'Teste',endereco:'Atendimento online',cidade:'Cataguases',estado:'MG',descricao:'Consulta remota',atende_por_tipo:[]}];
let injection;
try{
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('apoio_accessibility_preferences_v1','[]');localStorage.removeItem('apoio_requirements_v1');localStorage.setItem('apoio_accessibility_onboarding_v1','completed');const fixtures=${JSON.stringify({establishments:places,professionals})};const original=window.fetch;window.fetch=(url,options)=>{const value=String(url);if(value.includes('/rest/v1/')){const table=value.split('/rest/v1/')[1].split('?')[0];return Promise.resolve(new Response(JSON.stringify(fixtures[table]||[]),{headers:{'Content-Type':'application/json'}}));}return original(url,options);};`});
 const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4176'+path});await new Promise(resolve=>setTimeout(resolve,1200));};
 for(const width of [320,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1000});
  await open('/');assert.equal(await evaluate(`document.querySelectorAll('.place-catalog-row > li').length`),5);
  await evaluate(`[...document.querySelectorAll('.category-section button')].find(button=>button.textContent.includes('Ver todas')).click()`);
  await new Promise(resolve=>setTimeout(resolve,700));assert.equal(await evaluate(`document.querySelectorAll('.place-catalog-row > li').length`),9);
  await open('/?aba=profissionais');
  assert.equal(await evaluate(`document.querySelectorAll('.directory-actions a').length`),1);
  assert.match(await evaluate(`document.querySelector('.directory-actions a').href`),/destination=Rua/);
  assert.equal(await evaluate(`document.querySelector('.online-appointment').textContent.includes('Atendimento online')`),true);
  await open('/?local='+places[0].id);
  assert.equal(await evaluate(`document.querySelectorAll('.review-entry').length`),5);
  assert.equal(await evaluate(`document.querySelectorAll('.review-star').length`),5);
  assert.equal(await evaluate(`Boolean(document.querySelector('#review-comment'))`),true);
  assert.equal(await evaluate(`document.querySelectorAll('#place-review-form form').length`),0);
  await evaluate(`document.querySelector('.review-expand').click()`);assert.equal(await evaluate(`document.querySelectorAll('.review-entry').length`),8);
  await evaluate(`document.querySelector('.review-expand').click()`);assert.equal(await evaluate(`document.querySelectorAll('.review-entry').length`),5);
  assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);
 }
 console.log('navigation and review browser checks passed: all places, physical/online appointments, five comments/expand/collapse and visible rating form at 320/1440');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});socket.close();}
