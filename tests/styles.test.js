import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionRoot = path.join(root, 'extension');

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const files = listFiles(extensionRoot);
const cssFiles = files.filter((file) => file.endsWith('.css'));
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const jsFiles = files.filter((file) => file.endsWith('.js'));

const themePath = path.join(extensionRoot, 'shared/theme.css');
const theme = read(themePath);

test('colors are defined only in shared/theme.css', () => {
  const offenders = [];

  for (const file of files.filter((candidate) => candidate !== themePath)) {
    for (const match of read(file).matchAll(/#[0-9a-fA-F]{3,8}(?![-\w])|\brgba?\(/g)) {
      offenders.push(`${rel(file)}: ${match[0]}`);
    }
  }

  assert.deepEqual(offenders, []);
});

test('CSS has no !important', () => {
  const offenders = cssFiles.filter((file) => /!important/.test(read(file))).map(rel);
  assert.deepEqual(offenders, []);
});

test('HTML has no inline style attributes', () => {
  const offenders = htmlFiles.filter((file) => /\sstyle\s*=/i.test(read(file))).map(rel);
  assert.deepEqual(offenders, []);
});

test('extension JavaScript has no innerHTML', () => {
  const offenders = jsFiles.filter((file) => /innerHTML/.test(read(file))).map(rel);
  assert.deepEqual(offenders, []);
});

test('extension JavaScript has no native dialog calls', () => {
  const offenders = jsFiles
    .filter((file) => /\b(alert|confirm|prompt)\s*\(/.test(read(file)))
    .map(rel);
  assert.deepEqual(offenders, []);
});

function channelLuminance(value) {
  const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return linear;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channelLuminance(value);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const tokens = new Map(
  [...theme.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]),
);

const surfaces = [
  'surface-sunken',
  'surface-base',
  'surface-raised',
  'surface-hover',
  'surface-active',
  'surface-overlay',
];
const textTokens = ['text', 'text-muted', 'text-faint', 'accent', 'success', 'warning', 'danger'];

test('text tokens meet 4.5:1 on every surface', () => {
  const failures = [];

  for (const text of textTokens) {
    for (const surface of surfaces) {
      const ratio = contrastRatio(tokens.get(text), tokens.get(surface));
      if (ratio < 4.5) {
        failures.push(`${text} on ${surface}: ${ratio.toFixed(2)}:1`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test('text on accent tokens meets 4.5:1', () => {
  const failures = [];

  for (const accent of ['accent', 'accent-hover', 'accent-active']) {
    const ratio = contrastRatio(tokens.get('text-on-accent'), tokens.get(accent));
    if (ratio < 4.5) {
      failures.push(`text-on-accent on ${accent}: ${ratio.toFixed(2)}:1`);
    }
  }

  assert.deepEqual(failures, []);
});
