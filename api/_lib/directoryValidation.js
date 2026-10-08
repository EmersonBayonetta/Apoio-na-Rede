const needs=['mobilidade','visual','auditiva','intelectual','invisivel'];
const text=(input,key,max=500,required=false)=>{const value=input?.[key]??'';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('Preencha os dados do cadastro corretamente.');return value.trim();};
export function validateDirectory(kind,input){
 if(kind==='routes')return {titulo:text(input,'titulo',500,true),cidade:text(input,'cidade',200,true),ponto_origem:text(input,'ponto_origem',500,true),ponto_destino:text(input,'ponto_destino',500,true),trecho_descricao:text(input,'trecho_descricao',5000,true),tem_rampa:input.tem_rampa===true,tem_piso_tatil:input.tem_piso_tatil===true,tem_semaforo_sonoro:input.tem_semaforo_sonoro===true};
 if(kind!=='professionals')throw Error('Tipo de cadastro inválido.');
 const data=Object.fromEntries(['nome','especialidade','cidade','estado','endereco','telefone','whatsapp','email','registro_profissional','descricao'].map(key=>[key,text(input,key,key==='descricao'?5000:500,['nome','especialidade','cidade','estado'].includes(key))]));
 data.estado=data.estado.toUpperCase();
 if(!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(data.estado))throw Error('Informe uma UF válida.');
 if(data.telefone&&!/^\d{10,11}$/.test(data.telefone.replace(/\D/g,'')))throw Error('Informe um telefone com DDD.');
 if(data.whatsapp&&!/^(55)?[1-9]\d{9,10}$/.test(data.whatsapp.replace(/\D/g,'')))throw Error('Informe um WhatsApp com DDD.');
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw Error('Informe um e-mail válido.');
 if(!Array.isArray(input.atende_por_tipo)||input.atende_por_tipo.length>5||input.atende_por_tipo.some(type=>!needs.includes(type)))throw Error('Necessidades atendidas inválidas.');
 return {...data,atende_por_tipo:[...new Set(input.atende_por_tipo)]};
}
