import {
  addBlockedSite,
  getBlockedSites,
  getTodayStats,
  removeBlockedSite,
  updateBlockedSite,
} from '../shared/storage.js';
import { findBlockedSite, normalizeHostname, parseCounterSite } from '../shared/utils.js';
import { setupBackupUI } from './backup.js';
import { setupDataTransferUI } from './data-transfer.js';
import { setupHabitsPage } from './habits.js';
import { setupNotesPage } from './notes.js';
import { setupSettingsPage } from './settings.js';

const addForm = document.querySelector('#add-site');
const hostnameInput = document.querySelector('#new-hostname');
const addSiteError = document.querySelector('#add-site-error');
const siteList = document.querySelector('#site-list');
const emptySites = document.querySelector('#empty-sites');
const walls = document.querySelector('#walls');
const wallTime = document.querySelector('#wall-time');
const skips = document.querySelector('#skips');

setupBackupUI();
setupDataTransferUI();
setupHabitsPage();
setupNotesPage();
setupSettingsPage();

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addSite().catch((error) => {
    console.error('Blank Wall add site failed:', error);
  });
});

hostnameInput.addEventListener('input', () => {
  hostnameInput.setCustomValidity('');
  addSiteError.hidden = true;
});

render().catch((error) => {
  console.error('Blank Wall dashboard failed:', error);
});

async function render() {
  const [stats, sites] = await Promise.all([getTodayStats(), getBlockedSites()]);
  renderStats(stats);
  renderSiteList(sites);
}

async function addSite() {
  const hostname = normalizeHostname(hostnameInput.value);

  if (!hostname) {
    hostnameInput.setCustomValidity('Enter a hostname like example.com');
    hostnameInput.reportValidity();
    return;
  }

  const sites = await getBlockedSites();
  const coveredBy = findBlockedSite(hostname, sites);
  const coveredEntry = sites.find((site) => findBlockedSite(site.hostname, [{ hostname }]));

  if (coveredBy || coveredEntry) {
    addSiteError.textContent = coveredBy
      ? `Already covered by ${coveredBy.hostname}.`
      : `This would also cover ${coveredEntry.hostname}. Edit that site instead.`;
    addSiteError.hidden = false;
    return;
  }

  await addBlockedSite(hostname);
  hostnameInput.value = '';
  hostnameInput.setCustomValidity('');
  addSiteError.hidden = true;
  await refreshSiteList();
}

async function refreshSiteList() {
  renderSiteList(await getBlockedSites());
}

function renderStats(stats) {
  walls.textContent = String(stats.walls);
  wallTime.textContent = `${Math.round(stats.wallSeconds / 60)} min`;
  skips.textContent = String(stats.skips);
}

function renderSiteList(sites) {
  siteList.replaceChildren();
  emptySites.hidden = sites.length > 0;

  for (const site of sites) {
    siteList.append(createSiteElement(site, sites));
  }
}

function createSiteElement(site, sites) {
  const item = document.createElement('li');
  item.className = 'site';

  const header = document.createElement('div');
  header.className = 'site__header';

  const hostname = document.createElement('span');
  hostname.className = 'site__hostname';
  hostname.textContent = site.hostname;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'site__remove';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => {
    removeBlockedSite(site.hostname)
      .then(refreshSiteList)
      .catch((error) => {
        console.error('Blank Wall remove site failed:', error);
      });
  });

  header.append(hostname, remove);

  const allowanceControl = createNumberControl(
    'Allowance (min)',
    site.allowanceMinutes ?? 15,
    (minutes) => updateBlockedSite(site.hostname, { allowanceMinutes: minutes }),
  );
  allowanceControl.hidden = !(site.allowContinue ?? true);

  const controls = document.createElement('div');
  controls.className = 'site__controls';
  controls.append(
    createNumberControl('Wall (min)', site.durationMinutes ?? 5, (minutes) =>
      updateBlockedSite(site.hostname, { durationMinutes: minutes })),
    createToggleControl('Notes', site.notesEnabled, (enabled) =>
      updateBlockedSite(site.hostname, { notesEnabled: enabled })),
    createToggleControl('Habits', site.habitsEnabled, (enabled) =>
      updateBlockedSite(site.hostname, { habitsEnabled: enabled })),
    createTextControl('Reminder note', site.note ?? '', 200, (note) =>
      updateBlockedSite(site.hostname, { note })),
    createCounterSiteControl(site, sites),
    createToggleControl(
      'Allow continuing to the site after the wall',
      site.allowContinue ?? true,
      (enabled) => updateBlockedSite(site.hostname, { allowContinue: enabled }),
      (enabled) => {
        allowanceControl.hidden = !enabled;
      },
    ),
    allowanceControl,
  );

  item.append(header, controls);
  return item;
}

function createNumberControl(label, value, save) {
  const wrapper = document.createElement('label');
  wrapper.className = 'control';

  const text = document.createElement('span');
  text.textContent = label;

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0.1';
  input.step = 'any';
  input.value = String(value);
  input.addEventListener('change', () => {
    const minutes = Number(input.value);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      input.value = String(value);
      return;
    }

    save(minutes)
      .then(() => {
        value = minutes;
      })
      .catch((error) => {
        input.value = String(value);
        console.error('Blank Wall duration update failed:', error);
      });
  });

  wrapper.append(text, input);
  return wrapper;
}

function createTextControl(label, value, maxLength, save) {
  const wrapper = document.createElement('label');
  wrapper.className = 'control';

  const text = document.createElement('span');
  text.textContent = label;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.maxLength = maxLength;
  input.addEventListener('change', () => {
    const next = input.value.trim();
    save(next)
      .then(() => {
        value = next;
      })
      .catch((error) => {
        input.value = value;
        console.error('Blank Wall site setting update failed:', error);
      });
  });

  wrapper.append(text, input);
  return wrapper;
}

function createCounterSiteControl(site, sites) {
  const wrapper = document.createElement('label');
  wrapper.className = 'control';

  const text = document.createElement('span');
  text.textContent = 'Counter site';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = site.counterSite ?? '';
  input.placeholder = 'example.com';
  input.spellcheck = false;

  const error = document.createElement('p');
  error.className = 'site__error';
  error.hidden = true;

  input.addEventListener('change', () => {
    const parsed = parseCounterSite(input.value);

    if (parsed.error) {
      error.textContent = parsed.error;
      error.hidden = false;
      input.value = site.counterSite ?? '';
      return;
    }

    if (parsed.hostname && findBlockedSite(parsed.hostname, sites)) {
      error.textContent = 'This site is in your blocked list.';
      error.hidden = false;
    } else {
      error.hidden = true;
    }

    const counterSite = parsed.url;
    input.value = counterSite;
    updateBlockedSite(site.hostname, { counterSite })
      .then(() => {
        site.counterSite = counterSite;
      })
      .catch((cause) => {
        input.value = site.counterSite ?? '';
        console.error('Blank Wall counter site update failed:', cause);
      });
  });

  wrapper.append(text, input);

  const field = document.createElement('div');
  field.className = 'site__field';
  field.append(wrapper, error);
  return field;
}

function createToggleControl(label, checked, save, onChange) {
  const wrapper = document.createElement('label');
  wrapper.className = 'control';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.addEventListener('change', () => {
    if (onChange) {
      onChange(input.checked);
    }

    save(input.checked).catch((error) => {
      input.checked = !input.checked;
      if (onChange) {
        onChange(input.checked);
      }
      console.error('Blank Wall site setting update failed:', error);
    });
  });

  const text = document.createElement('span');
  text.textContent = label;

  wrapper.append(input, text);
  return wrapper;
}
