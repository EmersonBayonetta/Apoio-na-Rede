import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESSIBILITY_RESOURCES, CONTRIBUTION_RESOURCES, resourceState } from '../src/data/accessibilityResources.ts';

const sensory = [
  ['area_descanso', 'Área de descanso ou espaço tranquilo'],
  ['iluminacao_ajustavel', 'Iluminação suave ou ajustável'],
  ['horario_tranquilo', 'Horário com menos estímulos'],
];
const criterion = (recurso, presente) => ({ id: recurso, establishment_id: 'place', tipo_deficiencia: 'intelectual', criterio: recurso, recurso, presente });

test('sensory resources are listed with their labels', () => {
  for (const [id, label] of sensory) assert.equal(ACCESSIBILITY_RESOURCES.find(resource => resource.id === id)?.label, label);
  // Community reports stay limited to the 12 answers the database accepts.
  assert.equal(CONTRIBUTION_RESOURCES.length, 12);
  for (const [id] of sensory) assert.ok(CONTRIBUTION_RESOURCES.some(resource => resource.id === id));
});
test('sensory resources use the same yes, no and unknown states', () => {
  for (const [id] of sensory) {
    assert.equal(resourceState([criterion(id, true)], id), 'sim');
    assert.equal(resourceState([criterion(id, false)], id), 'nao');
    assert.equal(resourceState([], id), 'desconhecido');
  }
});
test('registration lists sensory resources under the intellectual type', () => {
  for (const [id] of sensory) assert.equal(ACCESSIBILITY_RESOURCES.find(resource => resource.id === id)?.tipo, 'intelectual');
});
test('registration resources have unique ids and texts, so no question is asked twice', () => {
  const texts = ACCESSIBILITY_RESOURCES.flatMap(resource => [resource.legacy, ...(resource.aliases ?? [])]);
  assert.equal(new Set(ACCESSIBILITY_RESOURCES.map(resource => resource.id)).size, ACCESSIBILITY_RESOURCES.length);
  assert.equal(new Set(ACCESSIBILITY_RESOURCES.map(resource => resource.label)).size, ACCESSIBILITY_RESOURCES.length);
  assert.equal(new Set(texts).size, texts.length);
});
test('every needs type has at least one resource users can require', () => {
  for (const tipo of ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel']) assert.ok(ACCESSIBILITY_RESOURCES.some(resource => resource.tipo === tipo), tipo);
});
test('older registration texts map to the merged resource', () => {
  const old = (criterio, presente) => ({ id: criterio, establishment_id: 'place', tipo_deficiencia: 'mobilidade', criterio, presente });
  assert.equal(resourceState([old('Portas e corredores com largura mínima de 90cm', true)], 'cadeira_rodas'), 'sim');
  assert.equal(resourceState([old('Espaço confortável para descanso e hidratação', false)], 'area_descanso'), 'nao');
  assert.equal(resourceState([old('Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)', true)], 'entrada_acessivel'), 'desconhecido');
  assert.equal(resourceState([old('Cão-guia aceito com bebedouro e espaço seguro', true)], 'cao_guia'), 'sim');
});
