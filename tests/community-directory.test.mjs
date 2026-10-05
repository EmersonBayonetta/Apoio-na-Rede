import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProfessionals, filterRoutes, validateProfessional, validateRoute, whatsappUrl } from '../src/utils/communityDirectory.ts';

const professional = { nome: 'Ana', especialidade: 'Fisioterapia', cidade: 'Cataguases', estado: 'MG', endereco: '', telefone: '', whatsapp: '', registro_profissional: '', descricao: '', atende_por_tipo: [] };
const route = { origin: 'Praça Rui Barbosa', destination: 'Estação', city: 'Cataguases', description: 'Calçada regular', ramp: true, tactile: false, signal: false };

test('professional registration rejects blank required fields', () => {
  for (const field of ['nome', 'especialidade', 'cidade', 'estado']) {
    assert.throws(() => validateProfessional({ ...professional, [field]: '   ' }), { message: 'Preencha nome, especialidade, cidade e estado.' });
  }
});
test('professional registration rejects invalid UF and accepts lowercase UF', () => {
  assert.throws(() => validateProfessional({ ...professional, estado: 'zz' }), { message: 'Informe uma UF válida.' });
  assert.equal(validateProfessional({ ...professional, estado: ' mg ' }).estado, 'MG');
});
test('professional registration rejects phones without area code', () => {
  for (const telefone of ['3422-1234', '98765-4321', '123', '(32) 3422-12345-6']) {
    assert.throws(() => validateProfessional({ ...professional, telefone }), { message: 'Informe um telefone com DDD.' });
  }
  for (const telefone of ['(32) 3422-1234', '(32) 98765-4321', '0800 770 7722']) {
    assert.equal(validateProfessional({ ...professional, telefone }).telefone, telefone);
  }
});
test('professional registration rejects malformed whatsapp', () => {
  for (const whatsapp of ['98765-4321', '44 32 98765-4321', '+1 32 98765-4321', '+55 32 98765-43210']) {
    assert.throws(() => validateProfessional({ ...professional, whatsapp }), { message: 'Informe um WhatsApp com DDD.' });
  }
  assert.equal(validateProfessional({ ...professional, whatsapp: '+55 (32) 98765-4321' }).whatsapp, '+55 (32) 98765-4321');
});
test('valid professional is saved trimmed with uppercase UF and its own whatsapp', () => {
  const saved = validateProfessional({ ...professional, nome: '  Ana  ', especialidade: ' Fisioterapia ', cidade: ' Cataguases ', estado: 'mg', endereco: ' Rua A, 1 ', telefone: ' 0800 770 7722 ', whatsapp: '', registro_profissional: ' CREFITO 1 ', descricao: ' Atende em casa ', atende_por_tipo: ['visual'] });
  assert.deepEqual(saved, { nome: 'Ana', especialidade: 'Fisioterapia', cidade: 'Cataguases', estado: 'MG', endereco: 'Rua A, 1', telefone: '0800 770 7722', whatsapp: '', registro_profissional: 'CREFITO 1', descricao: 'Atende em casa', atende_por_tipo: ['visual'] });
});
test('whatsapp link adds the country code only when missing', () => {
  assert.equal(whatsappUrl('(32) 98765-4321'), 'https://wa.me/5532987654321');
  assert.equal(whatsappUrl('(32) 3422-1234'), 'https://wa.me/553234221234');
  assert.equal(whatsappUrl('(55) 99999-8888'), 'https://wa.me/5555999998888');
  assert.equal(whatsappUrl('+55 32 98765-4321'), 'https://wa.me/5532987654321');
  assert.equal(whatsappUrl('55 32 3422-1234'), 'https://wa.me/553234221234');
});
test('whatsapp link is omitted without a valid number', () => {
  for (const value of ['', undefined, '   ', '98765-4321', '+1 32 98765-4321', '+55 32 98765-43210']) assert.equal(whatsappUrl(value), null);
});
test('route registration rejects blank required fields', () => {
  for (const field of ['origin', 'destination', 'city', 'description']) {
    assert.throws(() => validateRoute({ ...route, [field]: '  ' }), { message: 'Preencha partida, destino, cidade e condições observadas.' });
  }
});
test('valid route is saved trimmed with title from origin and destination', () => {
  const saved = validateRoute({ ...route, origin: ' Praça Rui Barbosa ', destination: ' Estação  ', city: ' Cataguases ', description: ' Calçada regular ', tactile: true });
  assert.deepEqual(saved, {
    titulo: 'Praça Rui Barbosa → Estação', cidade: 'Cataguases', ponto_origem: 'Praça Rui Barbosa', ponto_destino: 'Estação',
    trecho_descricao: 'Calçada regular', tem_rampa: true, tem_piso_tatil: true, tem_semaforo_sonoro: false,
    nivel_seguranca: 'Relato da comunidade — não verificado', coordenadas: [], distancia_metros: 0, auditada: false,
  });
});

const physio = { id: 'p1', nome: 'Clínica Movimento', especialidade: 'Fisioterapia', cidade: 'São Paulo', estado: 'SP', atende_por_tipo: ['mobilidade'], descricao: '' };
const dentist = { id: 'p2', nome: 'Odonto Inclusiva', especialidade: 'Odontologia', cidade: 'Cataguases', estado: 'MG', atende_por_tipo: ['visual', 'auditiva'], descricao: '' };
const station = { id: 'r1', titulo: 'Praça → Estação', cidade: 'São João', ponto_origem: 'Praça', ponto_destino: 'Estação Ferroviária' };
const school = { id: 'r2', titulo: 'Escola → Hospital', cidade: 'Cataguases', ponto_origem: 'Escola', ponto_destino: 'Hospital' };
test('professional search ignores accents, case and repeated spaces', () => {
  assert.deepEqual(filterProfessionals([physio, dentist], '  FISIOTERAPIA   sao ', ''), [physio]);
  assert.deepEqual(filterProfessionals([physio, dentist], 'clinica', ''), [physio]);
});
test('route search ignores accents, case and repeated spaces', () => {
  assert.deepEqual(filterRoutes([station, school], 'estacao  FERROVIARIA'), [station]);
  assert.deepEqual(filterRoutes([station, school], 'sao joao'), [station]);
});
test('need filter lists only professionals serving that need', () => {
  assert.deepEqual(filterProfessionals([physio, dentist], '', 'auditiva'), [dentist]);
  assert.deepEqual(filterProfessionals([physio, dentist], 'fisioterapia', 'auditiva'), []);
});
test('blank search lists every item subject to the need filter', () => {
  assert.deepEqual(filterProfessionals([physio, dentist], '   ', ''), [physio, dentist]);
  assert.deepEqual(filterProfessionals([physio, dentist], '   ', 'mobilidade'), [physio]);
  assert.deepEqual(filterRoutes([station, school], '   '), [station, school]);
});
