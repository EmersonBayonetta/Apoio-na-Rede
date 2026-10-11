import test from 'node:test';
import assert from 'node:assert/strict';
import { splitBrazilianAddress } from '../src/utils/addressParts.ts';

test('Google address is split so city, UF and CEP are not repeated in the street field', () => {
  assert.deepEqual(splitBrazilianAddress('R. Maj. Vieira, 120 - Centro, Cataguases - MG, 36770-000, Brasil'),
    { endereco: 'R. Maj. Vieira, 120', bairro: 'Centro', cidade: 'Cataguases', estado: 'MG', cep: '36770-000' });
  assert.deepEqual(splitBrazilianAddress('Av. Astolfo Dutra, 500, Cataguases - MG, 36770001, Brazil'),
    { endereco: 'Av. Astolfo Dutra, 500', bairro: undefined, cidade: 'Cataguases', estado: 'MG', cep: '36770-001' });
});
test('address without city keeps the text and one without street leaves the street empty', () => {
  assert.deepEqual(splitBrazilianAddress('Rua Teste, 2'), { endereco: 'Rua Teste, 2', cep: undefined });
  assert.equal(splitBrazilianAddress('Cataguases - MG, 36770-000').endereco, '');
});
