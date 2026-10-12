import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeRegistrationPhoto, storeRegistrationPhotos } from '../api/_lib/registrationPhotos.js';

const photo = `data:image/jpeg;base64,${Buffer.from([255,216,255,0,255,217]).toString('base64')}`;
test('registration photos reject unsupported, malformed and oversized files', () => {
  assert.equal(decodeRegistrationPhoto('https://example.com/photo.jpg'), null);
  assert.deepEqual(decodeRegistrationPhoto(photo), Buffer.from([255,216,255,0,255,217]));
  for (const value of ['data:image/svg+xml;base64,abcd', 'data:image/jpeg;base64,YWJjZA==', `data:image/jpeg;base64,${'a'.repeat(280000)}`]) {
    assert.throws(() => decodeRegistrationPhoto(value));
  }
});
test('uploaded photos preserve cover order and can be cleaned up after rejected registration', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({url: String(url), method: options.method, body: options.body});
    return new Response(JSON.stringify(String(url).includes('/bucket/') ? {id:'place-photos',public:true} : {}), {status:200,headers:{'Content-Type':'application/json'}});
  };
  const result = await storeRegistrationPhotos('https://example.supabase.co','sb_secret_test',[photo,'https://example.com/photo.jpg'],fetchImpl);
  assert.match(result.urls[0], /^https:\/\/example.supabase.co\/storage\/v1\/object\/public\/place-photos\/.*\.jpg$/);
  assert.equal(result.urls[1], 'https://example.com/photo.jpg');
  assert.equal(calls.filter(call => call.method === 'POST').length, 1);
  await result.cleanup();
  assert.equal(calls.at(-1).method, 'DELETE');
});
