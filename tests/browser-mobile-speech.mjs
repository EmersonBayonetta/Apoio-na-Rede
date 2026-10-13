// Requires isolated Chrome CDP and a Vite demo server; override CDP_PORT / APP_PORT as needed.
import assert from 'node:assert/strict';

const targets = await (await fetch(`http://127.0.0.1:${process.env.CDP_PORT || '9228'}/json/list`)).json();
const ws = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve,reject) => {ws.onopen=resolve;ws.onerror=reject;});
let sequence=0;
let loadEvents=0;
const pending=new Map();
ws.onmessage=({data}) => {const message=JSON.parse(data);if(message.method==='Page.loadEventFired')loadEvents++;const request=pending.get(message.id);if(request){clearTimeout(request.timer);pending.delete(message.id);if(message.error)request.reject(message.error);else request.resolve(message.result);}};
const send=(method,params={}) => new Promise((resolve,reject) => {const id=++sequence;const timer=setTimeout(() => {pending.delete(id);reject(Error(`Timeout: ${method}`));},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression => {const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);return result.result.value;};
const pause=ms => new Promise(resolve => setTimeout(resolve,ms));
const navigate=async (method,params={}) => {const before=loadEvents;await send(method,params);for(let i=0;i<150;i++){if(loadEvents>before)return;await pause(100);}throw Error('Navigation did not finish');};
const wait=async expression => {for(let i=0;i<100;i++){try{if(await evaluate(expression))return;}catch(error){if(error.code!==-32000)throw error;}await pause(100);}throw Error(`UI timeout: ${expression}\n${await evaluate('document.body.innerText')}`);};
const check=async (name,expression) => {assert.equal(await evaluate(expression),true,name);console.log('PASS',name);};

let injection;
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__spoken=[];window.__calls=[];Object.defineProperty(window,'speechSynthesis',{value:{paused:true,getVoices:()=>[{lang:'pt-BR',localService:false,name:'Remote'},{lang:'pt-BR',localService:true,name:'Local'}],cancel(){window.__calls.push('cancel')},resume(){window.__calls.push('resume');this.paused=false},speak(u){window.__calls.push('speak');window.__spoken.push(u);u.onstart?.()}}});Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text}}});`});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,mobile:true,deviceScaleFactor:1});
 await navigate('Page.navigate',{url:`http://127.0.0.1:${process.env.APP_PORT || '4189'}/`});await wait('!!document.querySelector("main")');
 await evaluate('localStorage.setItem("acessacidade_accessibility_settings",JSON.stringify({voiceReadingEnabled:true}))');
 await navigate('Page.reload');await wait('!!document.querySelector("main")');
 await evaluate(`document.querySelector('[aria-controls="accessibility-menu"]').click()`);
 await wait('!!document.querySelector("#accessibility-menu")');
 await evaluate('window.__expected=document.getElementById("main-content").innerText.replace(/<[^>]*>/g,"").trim().replace(/\\s+/g," ");[...document.querySelectorAll("#accessibility-menu button")].find(e=>e.textContent.includes("Ouvir página")).click()');
 await check('first chunk starts on tap and chooses local Portuguese voice','window.__spoken.length===1&&window.__spoken[0].voice.name==="Local"&&window.__calls.indexOf("resume")<window.__calls.indexOf("speak")');
 await evaluate('window.__first=window.__spoken[0];for(let i=0;i<1000;i++){const u=window.__spoken[i];if(!u)break;u.onend()}');
 await check('long reading completes all text in bounded chunks','window.__spoken.length>1&&window.__spoken.every(u=>u.text.length<=220)&&window.__spoken.map(u=>u.text).join(" ")===window.__expected');
 await pause(100);await check('finished reading clears state','!document.body.innerText.includes("Lendo em voz alta")');
 await evaluate('[...document.querySelectorAll("#accessibility-menu button")].find(e=>e.textContent.includes("Ouvir página")).click()');await pause(100);
 await evaluate('window.__first.onend()');await pause(100);await check('stale completion cannot stop restarted reading','document.body.innerText.includes("Lendo em voz alta")');
 await evaluate(`document.querySelector('[aria-label="Parar leitura em voz alta"]').click();window.__count=window.__spoken.length;window.__spoken.at(-1).onend()`);await pause(100);
 await check('stop prevents queued continuation','window.__spoken.length===window.__count&&!document.body.innerText.includes("Lendo em voz alta")');
 await evaluate('speechSynthesis.speak=u=>window.__spoken.push(u);speechSynthesis.speaking=false;[...document.querySelectorAll("#accessibility-menu button")].find(e=>e.textContent.includes("Ouvir página")).click()');
 await wait('document.body.innerText.includes("A leitura não iniciou")');
 await check('silent mobile engine does not leave reading status stuck','!document.body.innerText.includes("Lendo em voz alta")');
 await evaluate(`document.querySelector('[aria-label="Fechar aviso da leitura"]').click()`);await pause(100);
 await check('speech warning can be dismissed',`!document.querySelector('[role="alert"]')`);
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}
