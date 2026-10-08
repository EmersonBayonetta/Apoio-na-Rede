import type { AccessibleRoute, DisabilityType, Professional } from '../types';
import { normalizeSearchText } from './normalizeSearchText.ts';
import { validUf } from './registrationValidation.ts';

const digits = (value = '') => value.replace(/\D/g, '');
const validPhone = (value: string) => [10, 11].includes(digits(value).length);
const whatsappDigits = (value = '') => {
  const number = digits(value);
  const full = [10, 11].includes(number.length) ? `55${number}` : [12, 13].includes(number.length) && number.startsWith('55') ? number : null;
  // Toll-free and other numbers starting with 0 have no WhatsApp.
  return full && !full.startsWith('550') ? full : null;
};

export function whatsappUrl(value?: string): string | null {
  const number = whatsappDigits(value);
  return number ? `https://wa.me/${number}` : null;
}

export function validateProfessional(data: Omit<Professional, 'id'>): Omit<Professional, 'id'> {
  const trimmed = {
    nome: data.nome.trim(), especialidade: data.especialidade.trim(), cidade: data.cidade.trim(), estado: data.estado.trim().toUpperCase(),
    endereco: data.endereco?.trim() ?? '', telefone: data.telefone?.trim() ?? '', whatsapp: data.whatsapp?.trim() ?? '',
    registro_profissional: data.registro_profissional?.trim() ?? '', descricao: data.descricao.trim(), atende_por_tipo: data.atende_por_tipo,
    ...(data.email===undefined?{}:{email:data.email.trim()}),
  };
  if (![trimmed.nome, trimmed.especialidade, trimmed.cidade, trimmed.estado].every(Boolean)) throw new Error('Preencha nome, especialidade, cidade e estado.');
  if (!validUf(trimmed.estado)) throw new Error('Informe uma UF válida.');
  if (trimmed.telefone && !validPhone(trimmed.telefone)) throw new Error('Informe um telefone com DDD.');
  if (trimmed.whatsapp && !whatsappDigits(trimmed.whatsapp)) throw new Error('Informe um WhatsApp com DDD.');
  if(trimmed.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email))throw new Error('Informe um e-mail válido.');
  return trimmed;
}

export function validateRoute(data: { origin: string; destination: string; city: string; description: string; ramp: boolean; tactile: boolean; signal: boolean }): Omit<AccessibleRoute, 'id'> {
  const [origin, destination, city, description] = [data.origin, data.destination, data.city, data.description].map(value => value.trim());
  if (![origin, destination, city, description].every(Boolean)) throw new Error('Preencha partida, destino, cidade e condições observadas.');
  return {
    titulo: `${origin} → ${destination}`, cidade: city, ponto_origem: origin, ponto_destino: destination,
    trecho_descricao: description, tem_rampa: data.ramp, tem_piso_tatil: data.tactile, tem_semaforo_sonoro: data.signal,
    nivel_seguranca: 'Relato da comunidade — não verificado', coordenadas: [], distancia_metros: 0, auditada: false,
  };
}

const matches = (fields: string[], query: string) => normalizeSearchText(fields.join(' ')).includes(normalizeSearchText(query));

export function filterProfessionals(list: Professional[], query: string, need: DisabilityType | ''): Professional[] {
  return list.filter(p => matches([p.nome, p.especialidade, p.cidade, p.estado], query) && (!need || p.atende_por_tipo.includes(need)));
}

export function filterRoutes(list: AccessibleRoute[], query: string): AccessibleRoute[] {
  return list.filter(r => matches([r.titulo, r.cidade, r.ponto_origem, r.ponto_destino], query));
}
