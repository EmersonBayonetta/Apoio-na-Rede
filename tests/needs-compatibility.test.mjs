import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRequirements, compatibilityLabel, hasUnmetEssential, parseRequirementProfile } from '../src/utils/needsCompatibility.ts';

const criterion = (recurso, presente) => ({ id: `${recurso}-${presente}`, establishment_id: 'place', tipo_deficiencia: 'mobilidade', criterio: recurso, recurso, presente });
const ids = list => list.map(item => item.id);

test('stored profile ignores invalid JSON, unknown resources and unknown levels', () => {
  assert.deepEqual(parseRequirementProfile(null), {});
  assert.deepEqual(parseRequirementProfile('{broken'), {});
  assert.deepEqual(parseRequirementProfile('["rampa"]'), {});
  assert.deepEqual(parseRequirementProfile(JSON.stringify({ rampa: 'indispensavel', banheiro_pcd: 'desejavel', teleporte: 'indispensavel', elevador: 'sempre', libras: 'nao_preciso' })), { rampa: 'indispensavel', banheiro_pcd: 'desejavel' });
});
test('each requirement is classified as met, unmet or without information', () => {
  const match = compareRequirements([criterion('rampa', true), criterion('elevador', false)], { rampa: 'desejavel', elevador: 'desejavel', banheiro_pcd: 'desejavel' });
  assert.deepEqual(ids(match.atendidos), ['rampa']);
  assert.deepEqual(ids(match.naoAtendidos), ['elevador']);
  assert.deepEqual(ids(match.semInformacao), ['banheiro_pcd']);
  assert.equal(match.total, 3);
});
test('label states met requirements out of the total', () => {
  const criteria = ['rampa', 'elevador', 'corrimao', 'libras'].map(id => criterion(id, true));
  const profile = { rampa: 'indispensavel', elevador: 'desejavel', corrimao: 'desejavel', libras: 'desejavel', banheiro_pcd: 'indispensavel' };
  assert.equal(compatibilityLabel(compareRequirements(criteria, profile)), 'Atende 4 de 5 requisitos');
});
test('unknown information is never counted as met or unmet', () => {
  const match = compareRequirements([criterion('rampa', null)], { rampa: 'indispensavel', elevador: 'indispensavel' });
  assert.deepEqual([match.atendidos.length, match.naoAtendidos.length, match.semInformacao.length], [0, 0, 2]);
  assert.deepEqual(match.indispensaveisNaoAtendidos, []);
});
test('conflicting reports count as without information', () => {
  const match = compareRequirements([criterion('rampa', true), criterion('rampa', false)], { rampa: 'indispensavel' });
  assert.deepEqual(ids(match.semInformacao), ['rampa']);
  assert.equal(hasUnmetEssential([criterion('rampa', true), criterion('rampa', false)], { rampa: 'indispensavel' }), false);
});
test('unmet essential requirements are listed by label', () => {
  const match = compareRequirements([criterion('banheiro_pcd', false), criterion('elevador', false)], { banheiro_pcd: 'indispensavel', elevador: 'desejavel' });
  assert.deepEqual(match.indispensaveisNaoAtendidos, ['Banheiro PCD']);
});
test('an empty profile produces no comparison', () => {
  assert.equal(compareRequirements([criterion('rampa', true)], {}), null);
});
test('places without a record have every requirement without information', () => {
  const match = compareRequirements(undefined, { rampa: 'indispensavel', area_descanso: 'desejavel' });
  assert.deepEqual(ids(match.semInformacao), ['rampa', 'area_descanso']);
  assert.equal(compatibilityLabel(match), 'Atende 0 de 2 requisitos');
});
test('essential filter hides only places with an essential marked as no', () => {
  const profile = { rampa: 'indispensavel', elevador: 'desejavel' };
  assert.equal(hasUnmetEssential([criterion('rampa', false)], profile), true);
  assert.equal(hasUnmetEssential([criterion('rampa', true), criterion('elevador', false)], profile), false);
  assert.equal(hasUnmetEssential([], profile), false);
  assert.equal(hasUnmetEssential(undefined, profile), false);
  assert.equal(hasUnmetEssential([criterion('rampa', false)], {}), false);
});
