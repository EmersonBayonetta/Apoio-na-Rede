// Plain JavaScript: Vercel's Node runtime must not load frontend TypeScript.
export function validateRegistration(data) {
 if (![data.nome,data.descricao,data.endereco,data.cidade].every(value=>value.trim()))throw Error('Preencha nome, descrição, endereço e cidade.');
 if (!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(data.estado))throw Error('Informe uma UF válida.');
 if (!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)||Math.abs(data.latitude)>90||Math.abs(data.longitude)>180)throw Error('Informe coordenadas válidas para o local.');
 if (!data.fotos.every(value=>{try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}}))throw Error('Informe URLs de fotos válidas (HTTP ou HTTPS).');
}
