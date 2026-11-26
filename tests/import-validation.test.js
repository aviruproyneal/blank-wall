import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeImportData } from '../extension/shared/import-data.js';

const storageUrl = new URL('../extension/shared/storage.js', import.meta.url).href;

test('normalization skips invalid records and reports counts per type', () => {
  const { data, counts } = normalizeImportData({
    blockedSites: [
      { hostname: 'Example.com', durationMinutes: 0, note: 'x'.repeat(250), counterSite: 'ref.test' },
      { hostname: 'bad host' },
      { hostname: 'https://example.com/other' },
      { hostname: 'ftp://bad.test' },
      { hostname: 'valid.test', allowanceMinutes: 0, counterSite: 'ftp://bad.test' },
    ],
    habits: [
      {
        id: '001',
        title: 'y'.repeat(100),
        action: 'legacy',
        occurrences: [
          { timestamp: '2026-01-01T00:00:00.000Z', counterUsed: 1 },
          { timestamp: 'bad' },
        ],
      },
      { id: '1', title: 'invalid id' },
      { id: '001', title: 'duplicate' },
    ],
    notes: [
      { id: 'n1', timestamp: '2026-01-01T00:00:00.000Z', text: ' kept ', habitId: '001' },
      { id: 'n2', timestamp: 'bad', text: 'dropped' },
      { id: 'n3', timestamp: '2026-01-01T00:00:00.000Z', text: '   ' },
    ],
  });

  assert.deepEqual(counts, {
    sites: { imported: 2, skipped: 3 },
    habits: { imported: 1, skipped: 2 },
    notes: { imported: 1, skipped: 2 },
  });
  assert.deepEqual(data.blockedSites.map((site) => site.hostname), ['example.com', 'valid.test']);
  assert.equal(data.blockedSites[0].durationMinutes, 5);
  assert.equal(data.blockedSites[0].note.length, 200);
  assert.equal(data.blockedSites[0].counterSite, 'https://ref.test/');
  assert.equal(data.blockedSites[1].allowanceMinutes, 15);
  assert.equal(data.blockedSites[1].counterSite, '');
  assert.equal(data.habits[0].response, 'legacy');
  assert.equal(data.habits[0].title.length, 80);
  assert.equal(data.habits[0].occurrences.length, 1);
  assert.equal(data.notes[0].text, 'kept');
  assert.equal(data.notes[0].habitId, '001');
});

test('importBackupData stores normalized data and returns counts', async () => {
  const state = {
    schemaVersion: 3,
    blockedSites: [{ hostname: 'old.test' }],
    habits: [],
    notes: [],
    stats: {},
    allowances: {},
    settings: { defaultDurationMinutes: 5, skipRule: 'none' },
    nextHabitNumber: 1,
  };

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
          Object.assign(state, items);
          callback();
        },
      },
    },
  };

  const { importBackupData } = await import(`${storageUrl}?import=1`);
  const counts = await importBackupData({
    blockedSites: [{ hostname: 'new.test' }, { hostname: 'bad host' }],
    habits: [{ id: '004', title: 'New' }],
    notes: [{ id: 'note-1', timestamp: '2026-01-01T00:00:00.000Z', text: 'Note' }],
  });

  assert.deepEqual(counts, {
    sites: { imported: 1, skipped: 1 },
    habits: { imported: 1, skipped: 0 },
    notes: { imported: 1, skipped: 0 },
  });
  assert.deepEqual(state.blockedSites.map((site) => site.hostname), ['new.test']);
  assert.equal(state.nextHabitNumber, 5);
  assert.equal(state.settings.defaultDurationMinutes, 5);
});
