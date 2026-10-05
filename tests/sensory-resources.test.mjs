import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESSIBILITY_RESOURCES, registrationCriteriaTemplates, resourceState } from '../src/data/accessibilityResources.ts';

const sensory = [
  ['area_descanso', 'Área de descanso ou espaço tranquilo'],
  ['iluminacao_ajustavel', 'Iluminação suave ou ajustável'],
  ['horario_tranquilo', 'Horário com menos estímulos'],
];
const criterion = (recurso, presente) => ({ id: recurso, establishment_id: 'place', tipo_deficiencia: 'intelectual', criterio: recurso, recurso, presente });

test('sensory resources are listed with their labels', () => {
  for (const [id, label] of sensory) assert.equal(ACCESSIBILITY_RESOURCES.find(resource => resource.id === id)?.label, label);
  assert.equal(ACCESSIBILITY_RESOURCES.length, 12);
});
test('sensory resources use the same yes, no and unknown states', () => {
  for (const [id] of sensory) {
    assert.equal(resourceState([criterion(id, true)], id), 'sim');
    assert.equal(resourceState([criterion(id, false)], id), 'nao');
    assert.equal(resourceState([], id), 'desconhecido');
  }
});
test('registration lists sensory resources under the intellectual type', () => {
  const defaults = [{ tipo: 'mobilidade', criterio: 'Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)', defaultChecked: true }];
  const templates = registrationCriteriaTemplates(defaults);
  for (const [id] of sensory) {
    const resource = ACCESSIBILITY_RESOURCES.find(item => item.id === id);
    assert.deepEqual(templates.filter(item => item.criterio === resource.legacy), [{ tipo: 'intelectual', criterio: resource.legacy }]);
  }
  assert.equal(templates.filter(item => item.criterio === defaults[0].criterio).length, 1);
  assert.equal(templates.length, 12);
});
