// Shared by the browser and Node API; no runtime-specific imports.
export const registrationTextSchema = Object.freeze({
  nome: Object.freeze({ label: 'Nome do estabelecimento', min: 3, max: 5000 }),
  descricao: Object.freeze({ label: 'Descrição do local', min: 20, max: 5000 }),
  endereco: Object.freeze({ label: 'Endereço', min: 5, max: 5000 }),
  cidade: Object.freeze({ label: 'Cidade', min: 3, max: 5000 }),
});
export function registrationTextError(field, value) {
  const rule = registrationTextSchema[field];
  if (!rule) throw Error('Campo de cadastro desconhecido.');
  if (typeof value !== 'string' || !value.trim()) return `${rule.label}: preenchimento obrigatório.`;
  if (value.trim().length < rule.min) return `${rule.label}: informe pelo menos ${rule.min} caracteres, sem contar espaços nas pontas.`;
  if (value.length > rule.max) return `${rule.label}: use no máximo ${rule.max} caracteres.`;
  return null;
}
export function validPhotoUrl(value) {
  if (typeof value !== 'string') return false;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); }
  catch { return false; }
}
export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}
export function validUf(value) {
  return typeof value === 'string' && /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(value);
}
export function validateRegistration(data) {
  if (!data || typeof data !== 'object') throw Error('Preencha os dados do cadastro.');
  for (const field of Object.keys(registrationTextSchema)) {
    const error = registrationTextError(field, data[field]);
    if (error) throw Error(error);
  }
  if (!validUf(data.estado)) throw Error('Informe uma UF válida.');
  if (!validCoordinates(data.latitude, data.longitude)) throw Error('Informe coordenadas válidas para o local.');
  if (!Array.isArray(data.fotos) || !data.fotos.every(validPhotoUrl)) throw Error('Informe URLs de fotos válidas (HTTP ou HTTPS).');
}
