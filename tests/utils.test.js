import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  findBlockedSite,
  formatClock,
  formatHabitNumber,
  formatOccurrenceDate,
  formatTimestamp,
  normalizeCounterSite,
  normalizeHostname,
  parseCounterSite,
  parseHttpUrl,
} from '../extension/shared/utils.js';

test('parseHttpUrl accepts only http and https', () => {
  assert.equal(parseHttpUrl('https://example.com/path')?.href, 'https://example.com/path');
  assert.equal(parseHttpUrl('http://example.com')?.hostname, 'example.com');
  assert.equal(parseHttpUrl('ftp://example.com'), null);
  assert.equal(parseHttpUrl('not a url'), null);
});

test('normalizeHostname handles bare hosts, URLs, case, and stray dots', () => {
  assert.equal(normalizeHostname('  HTTPS://WWW.Example.com/path  '), 'www.example.com');
  assert.equal(normalizeHostname('example.com'), 'example.com');
  assert.equal(normalizeHostname('.example.com.'), 'example.com');
  assert.equal(normalizeHostname('not a host'), null);
  assert.equal(normalizeHostname(''), null);
});

test('findBlockedSite matches exact hosts and subdomains case-insensitively', () => {
  const sites = [{ hostname: 'Example.com' }, { hostname: 'social.test' }];

  assert.equal(findBlockedSite('EXAMPLE.COM', sites)?.hostname, 'Example.com');
  assert.equal(findBlockedSite('www.example.com', sites)?.hostname, 'Example.com');
  assert.equal(findBlockedSite('blog.social.test', sites)?.hostname, 'social.test');
  assert.equal(findBlockedSite('notexample.com', sites), null);
  assert.equal(findBlockedSite(undefined, sites), null);
  assert.equal(findBlockedSite('example.com', [null, {}, { hostname: '' }]), null);
});

test('parseCounterSite normalizes bare hosts and rejects other schemes', () => {
  assert.deepEqual(parseCounterSite(''), { url: '', hostname: '' });
  assert.deepEqual(parseCounterSite(' Example.com '), {
    url: 'https://example.com/',
    hostname: 'example.com',
  });
  assert.deepEqual(parseCounterSite('http://WWW.Example.com/path?a=1'), {
    url: 'http://www.example.com/path?a=1',
    hostname: 'www.example.com',
  });
  assert.deepEqual(parseCounterSite('ftp://example.com'), {
    error: 'Enter a valid website address.',
  });
  assert.deepEqual(parseCounterSite('not a site'), {
    error: 'Enter a valid website address.',
  });
});

test('normalizeCounterSite returns a full http(s) URL or empty', () => {
  assert.equal(normalizeCounterSite('example.com'), 'https://example.com/');
  assert.equal(normalizeCounterSite(' HTTPS://Example.com/a '), 'https://example.com/a');
  assert.equal(normalizeCounterSite('ftp://example.com'), '');
  assert.equal(normalizeCounterSite(null), '');
});

test('formatters are stable and handle invalid input', () => {
  const stamp = '2026-06-15T12:34:00.000Z';

  assert.equal(formatClock(125), '02:05');
  assert.equal(formatHabitNumber('001'), '1');
  assert.equal(formatHabitNumber('bad'), 'bad');
  assert.equal(formatTimestamp('bad'), '');
  assert.equal(formatOccurrenceDate('bad'), '');

  const formatted = formatTimestamp(stamp);
  assert.match(formatted, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  assert.equal(new Date(formatted.replace(' ', 'T')).getTime(), Date.parse(stamp));
  assert.match(formatOccurrenceDate(stamp), /2026/);
});
