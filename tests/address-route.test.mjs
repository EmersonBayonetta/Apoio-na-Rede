import test from 'node:test';
import assert from 'node:assert/strict';
import { locateAddress } from '../src/services/addressService.ts';
import { fetchWalkingRoute } from '../src/services/routeService.ts';

test('address lookup recovers from network failure, invalid JSON and out-of-city results', async () => {
  const original = globalThis.fetch;
  try {
    for (const failure of [() => { throw Error('offline'); }, () => ({ ok: true, json: async () => { throw Error('invalid JSON'); } }),
      () => ({ ok: true, json: async () => [{ lat: '0', lon: '0' }] })]) {
      let calls = 0;
      globalThis.fetch = async (_url, options) => {
        assert.ok(options.signal instanceof AbortSignal);
        if (++calls === 1) return failure();
        return { ok: true, json: async () => ({ features: [{ geometry: { coordinates: [-42.69, -21.39] } }] }) };
      };
      assert.deepEqual(await locateAddress('Rua em Cataguases'), { latitude: -21.39, longitude: -42.69 });
      assert.equal(calls, 2);
    }
    globalThis.fetch = async () => ({ ok: true, json: async () => null });
    await assert.rejects(locateAddress('Rua desconhecida'), /Coordenadas/);
  } finally { globalThis.fetch = original; }
});

test('walking rejects impossible routes and permits cancelling an outstanding request', async () => {
  const original = globalThis.fetch;
  const origin = { latitude: -21.39, longitude: -42.69 };
  const destination = { ...origin, id: 'destination', nome: 'Local' };
  try {
    globalThis.fetch = async () => { throw Error('should not fetch invalid coordinates'); };
    await assert.rejects(fetchWalkingRoute({ ...origin, latitude: 91 }, destination), /Coordenadas/);
    for (const route of [
      { distance: -1, duration: 60, geometry: { coordinates: [[-42.69, -21.39], [-42.68, -21.38]] } },
      { distance: 1, duration: -1, geometry: { coordinates: [[-42.69, -21.39], [-42.68, -21.38]] } },
      { distance: 1, duration: 60, geometry: { coordinates: [[-42.69, -21.39], [181, 91]] } },
      { distance: 1, duration: 60, geometry: { coordinates: [null, null] } },
    ]) {
      globalThis.fetch = async () => ({ ok: true, json: async () => ({ routes: [route] }) });
      await assert.rejects(fetchWalkingRoute(origin, destination), /Rota/);
    }
    globalThis.fetch = async (_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
    const controller = new AbortController();
    const request = fetchWalkingRoute(origin, destination, controller.signal);
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  } finally { globalThis.fetch = original; }
});
