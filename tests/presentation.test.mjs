import test from 'node:test';
import assert from 'node:assert/strict';
import { directionsUrl } from '../src/utils/directionsUrl.ts';

test('directions open in walking mode with destination and place id', () => {
  const url = new URL(directionsUrl({ latitude: -21.39, longitude: -42.69, place_id: 'abc' }));
  assert.equal(url.searchParams.get('travelmode'), 'walking');
  assert.equal(url.searchParams.get('destination'), '-21.39,-42.69');
  assert.equal(url.searchParams.get('destination_place_id'), 'abc');
});

import { whatsappUrl } from '../src/utils/communityDirectory.ts';
test('toll-free numbers starting with 0 get no whatsapp link', () => {
  assert.equal(whatsappUrl('0800 770 7722'), null);
  assert.equal(whatsappUrl('55 0800 770 7722'), null);
  assert.equal(whatsappUrl('(32) 98765-4321'), 'https://wa.me/5532987654321');
  assert.equal(whatsappUrl('+55 32 98765-4321'), 'https://wa.me/5532987654321');
});

import { formatWalkingSummary } from '../src/utils/formatDistance.ts';
test('walking summary shows distance and whole minutes', () => {
  assert.equal(formatWalkingSummary(1234, 900), '1,2 km · 15 min');
  assert.equal(formatWalkingSummary(350, 290), '350 m · 5 min');
  assert.equal(formatWalkingSummary(40, 10), '40 m · 1 min');
});

import { tabFromUrl, urlForTab } from '../src/utils/appTabs.ts';
test('aba parameter maps to each tab and unknown values open explorer', () => {
  assert.equal(tabFromUrl('?aba=rotas'), 'routes');
  assert.equal(tabFromUrl('?aba=profissionais'), 'professionals');
  assert.equal(tabFromUrl('?aba=cadastro'), 'register');
  assert.equal(tabFromUrl('?aba=xyz'), 'explorer');
  assert.equal(tabFromUrl(''), 'explorer');
});
test('tab url sets aba, clears it for explorer and leaves the place view', () => {
  assert.equal(urlForTab('routes', 'https://app.test/?local=est-1&x=1'), 'https://app.test/?x=1&aba=rotas');
  assert.equal(urlForTab('explorer', 'https://app.test/?aba=rotas'), 'https://app.test/');
  assert.equal(urlForTab('register', 'https://app.test/'), 'https://app.test/?aba=cadastro');
});
