import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const chromePath = new URL('../extension/manifest.json', import.meta.url);
const firefoxPath = new URL('../extension/manifest.firefox.json', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);

test('manifests are valid JSON and differ only in background and Firefox settings', async () => {
  const chrome = JSON.parse(await readFile(chromePath, 'utf8'));
  const firefox = JSON.parse(await readFile(firefoxPath, 'utf8'));

  assert.deepEqual(chrome.permissions, firefox.permissions);
  assert.equal(chrome.browser_specific_settings, undefined);
  assert.equal(chrome.background.service_worker, 'background.js');
  assert.deepEqual(firefox.background.scripts, ['background.js']);
  assert.ok(firefox.browser_specific_settings?.gecko?.id);

  const chromeCommon = { ...chrome };
  const firefoxCommon = { ...firefox };
  delete chromeCommon.background;
  delete firefoxCommon.background;
  delete firefoxCommon.browser_specific_settings;

  assert.deepEqual(chromeCommon, firefoxCommon);
});

test('package.json only enables Node ES modules and the test script', async () => {
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));

  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.scripts.test, 'node --test tests/');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});
