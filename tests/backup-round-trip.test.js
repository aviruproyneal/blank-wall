import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseHabit,
  parseNotes,
  renderHabit,
  renderNotes,
} from '../extension/shared/backup.js';

const stamp = '2026-06-15T12:34:00.000Z';

test('note Markdown round trip preserves text, source, timestamp, and habit link', () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { randomUUID: () => 'note-1' },
  });

  try {
    const markdown = renderNotes('2026-06-15', [{
      id: 'note-1',
      timestamp: stamp,
      site: 'example.com',
      text: 'First line\nSecond line',
      habitId: '001',
    }]);
    const notes = parseNotes(markdown);

    assert.equal(notes.length, 1);
    assert.equal(notes[0].id, 'note-1');
    assert.equal(notes[0].timestamp, stamp);
    assert.equal(notes[0].site, 'example.com');
    assert.equal(notes[0].text, 'First line\nSecond line');
    assert.equal(notes[0].habitId, '001');
  } finally {
    if (cryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
    } else {
      delete globalThis.crypto;
    }
  }
});

test('habit Markdown round trip preserves front matter and timestamps', () => {
  const habit = {
    id: '007',
    title: 'Open site',
    trigger: 'Bored',
    response: 'Walk',
    reward: 'Tea',
    counterPlan: 'Stand up',
    occurrences: [{ timestamp: stamp, site: 'example.com', counterUsed: true }],
  };
  const markdown = renderHabit(habit);
  const parsed = parseHabit(markdown, '007-open-site.md');

  assert.equal(parsed.id, '007');
  assert.equal(parsed.title, 'Open site');
  assert.equal(parsed.trigger, 'Bored');
  assert.equal(parsed.response, 'Walk');
  assert.equal(parsed.reward, 'Tea');
  assert.equal(parsed.counterPlan, 'Stand up');
  assert.equal(parsed.occurrences.length, 1);
  assert.equal(parsed.occurrences[0].timestamp, stamp);
  assert.equal(parsed.occurrences[0].site, '');
  assert.equal(parsed.occurrences[0].counterUsed, true);
});

test('legacy action front matter maps to response', () => {
  const legacy = renderHabit({
    id: '007',
    title: 'Open site',
    response: 'Walk',
    occurrences: [],
  }).replace('response: Walk', 'action: Walk');
  const parsed = parseHabit(legacy, '007-open-site.md');

  assert.equal(parsed.response, 'Walk');
  assert.equal('action' in parsed, false);
});
