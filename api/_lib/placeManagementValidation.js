import { validateRegistration } from './registrationValidation.js';
import { decodeRegistrationPhoto } from './registrationPhotos.js';

const categories = ['alimentacao','saude','lazer_cultura','comercio_loja','servico_publico','banheiro_adaptado','educacao','hospedagem','transporte_mobilidade'];
const textFields = ['nome','descricao','endereco','bairro','cidade','estado','cep','telefone','whatsapp','horario_funcionamento'];
export function validatePlaceEdit(input) {
  if (!input || typeof input !== 'object') throw Error('Informe os dados do local.');
  const details = {};
  for (const key of textFields) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > 5000) throw Error('Preencha os dados do local corretamente.');
    details[key] = value.trim();
  }
  details.estado = details.estado.toUpperCase();
  details.categoria = input.categoria;
  details.latitude = input.latitude;
  details.longitude = input.longitude;
  details.fotos = input.fotos;
  if (!categories.includes(details.categoria) || !Array.isArray(details.fotos) || details.fotos.length > 10 || details.fotos.some(photo => typeof photo !== 'string' || photo.length > (photo.startsWith('data:') ? 280000 : 2000))) throw Error('Categoria ou fotos inválidas.');
  validateRegistration({...details, fotos: details.fotos.filter(photo => !decodeRegistrationPhoto(photo))});
  if (details.cep && !/^\d{5}-?\d{3}$/.test(details.cep)) throw Error('Informe um CEP com 8 dígitos.');
  if (details.telefone && ![10,11].includes(details.telefone.replace(/\D/g,'').length)) throw Error('Informe um telefone com DDD.');
  if (details.whatsapp && !/^(?:55)?\d{10,11}$/.test(details.whatsapp.replace(/\D/g,''))) throw Error('Informe um WhatsApp com DDD.');
  return details;
}
