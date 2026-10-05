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
