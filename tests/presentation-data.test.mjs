import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESENTATION_PLACES, PRESENTATION_ROUTES, PRESENTATION_PROFESSIONALS } from '../src/data/presentationData.ts';

test('twenty clearly identified presentation records cover every place category and need', () => {
  const all = [...PRESENTATION_PLACES, ...PRESENTATION_ROUTES, ...PRESENTATION_PROFESSIONALS];
  assert.equal(all.length, 20);
  assert.equal(new Set(all.map(item => item.id)).size, 20);
  assert.ok(all.every(item => item.demonstracao && item.status !== 'verificado'));
  assert.equal(new Set(PRESENTATION_PLACES.map(place => place.categoria)).size, 9);
  for (const place of PRESENTATION_PLACES) {
    assert.equal(place.criteria.length, 12);
    assert.equal(new Set(place.criteria.map(c => c.recurso)).size, 12);
    assert.ok(place.criteria.every(c => typeof c.presente === 'boolean'));
    for (const field of ['endereco','cep','descricao','telefone','whatsapp','email_contato','website','horario_funcionamento']) assert.ok(place[field]);
    assert.ok(place.fotos.length);
    assert.equal(place.total_avaliacoes, 0);
  }
  assert.equal(new Set(PRESENTATION_PROFESSIONALS.flatMap(p => p.atende_por_tipo)).size, 5);
  assert.ok(PRESENTATION_PROFESSIONALS.every(p => p.email.endsWith('@example.invalid') && p.registro_profissional.includes('sem validade')));
  assert.ok(PRESENTATION_ROUTES.every(r => !r.auditada && r.distancia_metros > 0 && r.duracao_segundos > 0 && r.coordenadas.length >= 2));
});
