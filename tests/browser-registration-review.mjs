// Normal build, Vite preview :4176 and isolated Chrome CDP :9223.
import assert from 'node:assert/strict';
const targets=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.onopen=resolve);
let sequence=0;const pending=new Map();
ws.onmessage=({data})=>{const r=JSON.parse(data);if(pending.has(r.id)){pending.get(r.id)(r.result);pending.delete(r.id);}};
const send=(method,params={})=>new Promise(resolve=>{const id=++sequence;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const open=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4176'+path});await pause(1200);};
let injection;
try{
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('apoio_accessibility_onboarding_v1','completed');const originalFetch=window.fetch;window.testSubmissions=[];window.fetch=(url,options)=>String(url)==='/api/register-place'?(window.testSubmissions.push(JSON.parse(options.body)),Promise.resolve(new Response(JSON.stringify({id:'test',status:'pendente',notified:true,message:'Cadastro pendente para revisão.'}),{headers:{'Content-Type':'application/json'}}))):originalFetch(url,options);`});
 await open('/?aba=cadastro');
 assert.ok(await evaluate(`document.querySelector('main h1')?.textContent.includes('Informe os recursos de acessibilidade')`),'public registration is available without login');
 assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Receber link de acesso')`),false);
 for(const [tab,kind,fields] of [['rotas','routes',{origin:'Praça Santa Rita, 462',destination:'Rua Major Vieira, 56',description:'Condições a verificar'}],['profissionais','professionals',{name:'Cadastro de teste',specialty:'Fisioterapia'}]]){
  await open('/?aba='+tab);await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('${kind==='routes'?'Compartilhar um trecho':'Cadastrar profissional'}')).click()`);await pause(100);
  assert.ok(await evaluate(`Boolean(document.querySelector('main form'))`),'directory form has no login gate');
  await evaluate(`(()=>{const form=document.querySelector('main form');for(const [name,value] of Object.entries(${JSON.stringify(fields)})){const field=form.elements.namedItem(name);Object.getOwnPropertyDescriptor(field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));}form.requestSubmit();})()`);await pause(300);
  assert.equal(await evaluate(`window.testSubmissions[0]?.kind`),kind);
  assert.ok(await evaluate(`document.querySelector('main').textContent.includes('Cadastro pendente para revisão.')`));
 }
 await open('/?aba=cadastro');
 for(const width of [320,390,1024,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1200});await pause(150);
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'no overflow at '+width);
 }
 await open('/');
 await evaluate(`[...document.querySelectorAll('nav button')].find(b=>b.textContent.trim()==='Minhas necessidades').click()`);await pause(150);
 await evaluate(`document.querySelector('.needs-choice').click()`);await pause(150);
 for(const theme of ['dark','light']){
  await evaluate(`document.documentElement.setAttribute('data-theme','${theme}')`);
  await pause(400);
  const colors=await evaluate(`(()=>{const b=document.querySelector('.needs-choice[aria-checked="true"]');return [getComputedStyle(b).backgroundColor,getComputedStyle(b.querySelector('.text-slate-900')).color,getComputedStyle(b.querySelector('.text-slate-500')).color]})()`);
  const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(n=>+n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  for(const color of colors.slice(1)){const a=luminance(colors[0]),b=luminance(color);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'selected text contrast '+theme);}
 }
 await open('/gestao');assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Administração')`),false);
 await open('/revisao?cadastro=00000000-0000-4000-8000-000000000001');
 assert.ok(await evaluate(`document.querySelector('main').textContent.includes('Abra o link de acesso')`));
 assert.equal(await evaluate(`Boolean(document.querySelector('main article'))`),false,'anonymous visitors cannot read pending details');
 assert.equal(await evaluate(`Boolean(document.querySelector('main button'))`),false,'anonymous visitors cannot approve');
 console.log('registration browser checks passed: public form, four widths, selected text contrast, disabled dashboard and anonymous review');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}
