import assert from 'node:assert/strict';
import { test } from 'node:test';

const storageUrl = new URL('../extension/shared/storage.js', import.meta.url).href;

async function loadStorage(state, tag) {
  let sets = 0;

  globalThis.chrome = {
    runtime: { lastError: undefined },
    storage: {
      local: {
        get(keys, callback) {
          if (keys === null || keys === undefined) {
            callback({ ...state });
          } else if (typeof keys === 'string') {
            callback({ [keys]: state[keys] });
          } else {
            callback(Object.fromEntries(keys.map((key) => [key, state[key]])));
          }
        },
        set(items, callback) {
          sets += 1;
          Object.assign(state, items);
          callback();
        },
      },
    },
  };

  const module = await import(`${storageUrl}?case=${tag}`);
  return { module, setCount: () => sets };
}

test('migrates schema 1 through 3, clamps allowances, and stays idempotent', async () => {
  const state = {
    schemaVersion: 1,
    habits: [
      { id: '001', title: 'Old', action: 'old response' },
      { id: '002', title: 'Both', action: 'old response', response: 'new response' },
    ],
    blockedSites: [
      { hostname: 'a.test' },
      { hostname: 'b.test', allowanceMinutes: 0 },
      { hostname: 'c.test', allowanceMinutes: 42 },
    ],
    settings: { defaultDurationMinutes: 5, skipRule: 'none', allowanceMinutes: 0 },
    stats: {},
    allowances: {},
    notes: [],
    nextHabitNumber: 3,
  };

  const { module } = await loadStorage(state, 'v1');
  await module.migrateStorage();

  assert.equal(state.schemaVersion, 3);
  assert.deepEqual(state.habits.map((habit) => habit.response), ['old response', 'new response']);
  assert.equal('action' in state.habits[0], false);
  assert.equal('action' in state.habits[1], false);
  assert.deepEqual(state.blockedSites[0], {
    note: '',
    counterSite: '',
    allowContinue: true,
    allowanceMinutes: 1,
    hostname: 'a.test',
  });
  assert.equal(state.blockedSites[1].allowanceMinutes, 1);
  assert.equal(state.blockedSites[2].allowanceMinutes, 42);
  assert.equal(state.settings.allowanceMinutes, undefined);

  const afterFirstRun = structuredClone(state);
  const repeat = await loadStorage(state, 'idempotent');
  await repeat.module.migrateStorage();

  assert.deepEqual(state, afterFirstRun);
  assert.equal(repeat.setCount(), 0);
});

test('invalid legacy allowance falls back to 15 minutes', async () => {
  const state = {
    schemaVersion: 1,
    habits: [],
    blockedSites: [{ hostname: 'a.test' }],
    settings: { allowanceMinutes: -4 },
  };

  const { module } = await loadStorage(state, 'invalid-allowance');
  await module.migrateStorage();

  assert.equal(state.blockedSites[0].allowanceMinutes, 15);
});
