import test from 'node:test';
import assert from 'node:assert/strict';
import { isIndoorPlace } from '../src/utils/indoorPlaces.ts';
import { externalDiscoveryPlaces } from '../src/utils/discoveryPlaces.ts';

test('excludes outdoor places by name and provider metadata', () => {
  assert.equal(isIndoorPlace({ nome: 'Praça Rui Barbosa' }), false);
  assert.equal(isIndoorPlace({ nome: 'Área de lazer' }, ['park']), false);
  assert.equal(isIndoorPlace({ nome: 'Rui Barbosa' }, [], { place: 'square' }), false);
  assert.equal(isIndoorPlace({ nome: 'Jardim' }, [], { leisure: 'garden' }), false);
  assert.equal(isIndoorPlace({ nome: 'Ponto de ônibus Central' }), false);
});

test('keeps establishments on square addresses and indoor cultural venues', () => {
  for (const nome of ['Farmácia Central', 'Museu Municipal', 'Escola Estadual', 'Restaurante Praça Viva']) {
    assert.equal(isIndoorPlace({ nome, endereco: 'Praça Rui Barbosa, 10' }), true);
  }
});

test('cached outdoor discovery results are filtered too', () => {
  const square = { id: 'square', nome: 'Praça Central', categoria: 'lazer_cultura' };
  const museum = { id: 'museum', nome: 'Museu Municipal', categoria: 'lazer_cultura' };
  assert.deepEqual(externalDiscoveryPlaces([square, museum], [], 'todas', false, true), [museum]);
});
