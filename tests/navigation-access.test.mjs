import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleNavigationTabs } from '../src/utils/navigationAccess.js';

test('visitor sees only public header destinations', () => {
  assert.deepEqual(visibleNavigationTabs(false), ['explorer', 'professionals']);
});

test('authenticated user also sees registration and their places', () => {
  assert.deepEqual(visibleNavigationTabs(true), ['explorer', 'professionals', 'register', 'my_places']);
});

test('ending a session restores the public-only header destinations', () => {
  const authenticated = visibleNavigationTabs(true);
  const afterSignOut = visibleNavigationTabs(false);
  assert.ok(authenticated.includes('register'));
  assert.ok(!afterSignOut.includes('register'));
  assert.deepEqual(afterSignOut, ['explorer', 'professionals']);
});
