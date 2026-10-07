// Normal build :4176, isolated Chrome :9223. Empty remote catalog is simulated.
import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();
ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method)),15000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,800));
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4176'+path});await pause();};
let injection;
try {
  await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
  injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');window.__writes=0;
    const original=window.fetch;
    window.fetch=(input,options={})=>{if(String(input).includes('/rest/v1/')){if(options.method&&options.method!=='GET')window.__writes++;return Promise.resolve(new Response('[]',{headers:{'Content-Type':'application/json'}}));}return original(input,options);};
  `});
  await open('/');
  for(const category of ['Alimentação','Saúde','Lazer','Comércio','Serviços','Banheiros','Educação','Transporte','Hospedagem']){
    await evaluate(`[...document.querySelectorAll('.category-tile')].find(b=>b.textContent.trim()===${JSON.stringify(category)}).click()`);await pause();
    assert.equal(await evaluate("document.querySelectorAll('main article').length"),1,category);
    assert.equal(await evaluate("document.querySelector('main article').innerText.includes('Demonstração')"),true,category);
  }
  await evaluate("document.querySelector('main article button').click()");await pause();
  assert.equal(await evaluate("document.body.innerText.includes('Exemplo fictício para apresentação')"),true);
  assert.equal(await evaluate("!!document.querySelector('#reviews-heading')"),false);
  assert.equal(await evaluate("document.querySelectorAll('main a[href^=\"tel:\"],main a[href*=\"wa.me\"],main a[href*=\"example.invalid\"]').length"),0);
  await send('Page.reload');await pause();assert.equal(await evaluate("document.querySelector('main h1').textContent"),'Pousada Jardim Sereno');
  for(const [tab,count] of [['rotas',5],['profissionais',6]]){
    await open('/?aba='+tab);
    assert.equal(await evaluate("document.querySelectorAll('main article').length"),count);
    assert.equal(await evaluate("[...document.querySelectorAll('main article')].every(a=>a.textContent.includes('Demonstração'))"),true);
    assert.equal(await evaluate("document.body.innerText.includes('Importar cadastros feitos anteriormente')"),false);
    assert.equal(await evaluate("document.querySelectorAll('main article a').length"),0);
    for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,mobile:width<1000,deviceScaleFactor:1});assert.equal(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'),true,tab+' '+width);}
    assert.equal(await evaluate('window.__writes'),0);
  }
  console.log('PASS 20 read-only presentation records, nine categories, detail reload, no import panels or actionable fake contacts, mobile layout');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await send('Network.setBlockedURLs',{urls:[]});ws.close();}
