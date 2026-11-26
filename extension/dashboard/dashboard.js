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

let fieldSequence = 0;

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

hostnameInput.addEventListener('input', clearAddSiteError);

hostnameInput.addEventListener('invalid', () => {
  showAddSiteError('Enter a hostname like example.com');
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
    const message = 'Enter a hostname like example.com';
    hostnameInput.setCustomValidity(message);
    showAddSiteError(message);
    hostnameInput.reportValidity();
    return;
  }

  const sites = await getBlockedSites();
  const coveredBy = findBlockedSite(hostname, sites);
  const coveredEntry = sites.find((site) => findBlockedSite(site.hostname, [{ hostname }]));

  if (coveredBy || coveredEntry) {
    showAddSiteError(coveredBy
      ? `Already covered by ${coveredBy.hostname}.`
      : `This would also cover ${coveredEntry.hostname}. Edit that site instead.`);
    return;
  }

  await addBlockedSite(hostname);
  hostnameInput.value = '';
  clearAddSiteError();
  await refreshSiteList();
}

function showAddSiteError(message) {
  addSiteError.textContent = message;
  addSiteError.hidden = false;
  hostnameInput.setAttribute('aria-invalid', 'true');
}

function clearAddSiteError() {
  hostnameInput.setCustomValidity('');
  hostnameInput.removeAttribute('aria-invalid');
  addSiteError.hidden = true;
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
  fieldSequence = 0;
  emptySites.hidden = sites.length > 0;

  for (const site of sites) {
    siteList.append(createSiteElement(site, sites));
  }
}

function createSiteElement(site, sites) {
  const item = document.createElement('li');
  item.className = 'site';

  const row = document.createElement('div');
  row.className = 'list-row site__row';

  const primary = document.createElement('div');
  primary.className = 'site__primary';

  const hostname = document.createElement('span');
  hostname.className = 'site__hostname';
  hostname.textContent = site.hostname;

  let durationMinutes = site.durationMinutes ?? 5;
  let allowanceMinutes = site.allowanceMinutes ?? 15;
  let allowContinue = site.allowContinue ?? true;
  let noteValue = site.note ?? '';
  let counterSite = site.counterSite ?? '';

  function continueLabel() {
    return allowContinue ? `continue ${allowanceMinutes} min` : 'continue off';
  }

  const meta = document.createElement('div');
  meta.className = 'site__meta';
  const durationMeta = createMetaItem(`${durationMinutes} min wall`);
  const continueMeta = createMetaItem(continueLabel());
  const notesMeta = createMetaItem(site.notesEnabled ? 'notes on' : 'notes off');
  const habitsMeta = createMetaItem(site.habitsEnabled ? 'habits on' : 'habits off');
  const noteMeta = createMetaItem(`note: ${noteValue}`);
  noteMeta.hidden = !noteValue;
  const counterMeta = createMetaItem(`counter: ${counterSite}`);
  counterMeta.hidden = !counterSite;
  meta.append(durationMeta, continueMeta, notesMeta, habitsMeta, noteMeta, counterMeta);
  primary.append(hostname, meta);

  const actions = document.createElement('div');
  actions.className = 'list-row__actions';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'button button--ghost site__remove';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => {
    removeBlockedSite(site.hostname)
      .then(refreshSiteList)
      .catch((error) => {
        console.error('Blank Wall remove site failed:', error);
      });
  });

  actions.append(remove);
  row.append(primary, actions);

  const allowanceControl = createNumberControl(
    'Allowance',
    allowanceMinutes,
    (minutes) => updateBlockedSite(site.hostname, { allowanceMinutes: minutes })
      .then(() => {
        allowanceMinutes = minutes;
        continueMeta.textContent = continueLabel();
      }),
    'Minutes available after the wall.',
  );
  allowanceControl.hidden = !allowContinue;

  const settings = document.createElement('div');
  settings.className = 'site__settings';
  settings.append(
    createNumberControl(
      'Wall duration',
      durationMinutes,
      (minutes) => updateBlockedSite(site.hostname, { durationMinutes: minutes })
        .then(() => {
          durationMinutes = minutes;
          durationMeta.textContent = `${durationMinutes} min wall`;
        }),
      'Minutes before the wall ends.',
    ),
    createToggleControl(
      'Notes',
      site.notesEnabled,
      (enabled) => updateBlockedSite(site.hostname, { notesEnabled: enabled }),
      (enabled) => {
        notesMeta.textContent = enabled ? 'notes on' : 'notes off';
      },
      'Allow quick notes from the wall.',
    ),
    createToggleControl(
      'Habits',
      site.habitsEnabled,
      (enabled) => updateBlockedSite(site.hostname, { habitsEnabled: enabled }),
      (enabled) => {
        habitsMeta.textContent = enabled ? 'habits on' : 'habits off';
      },
      'Allow habit entries from the wall.',
    ),
    createTextControl(
      'Reminder note',
      noteValue,
      200,
      (note) => updateBlockedSite(site.hostname, { note })
        .then(() => {
          noteValue = note;
          noteMeta.textContent = `note: ${noteValue}`;
          noteMeta.hidden = !noteValue;
        }),
      'Shown on the wall while you decide.',
    ),
    createCounterSiteControl(site, sites, (next) => {
      counterSite = next;
      counterMeta.textContent = `counter: ${counterSite}`;
      counterMeta.hidden = !counterSite;
    }),
    createToggleControl(
      'Allow continuing',
      allowContinue,
      (enabled) => updateBlockedSite(site.hostname, { allowContinue: enabled }),
      (enabled) => {
        allowContinue = enabled;
        allowanceControl.hidden = !enabled;
        continueMeta.textContent = continueLabel();
      },
      'Let you enter the site after the wall.',
    ),
    allowanceControl,
  );

  item.append(row, settings);
  return item;
}

function createMetaItem(text) {
  const item = document.createElement('span');
  item.textContent = text;
  return item;
}

function nextFieldId() {
  fieldSequence += 1;
  return `site-field-${fieldSequence}`;
}

function createField(labelText, helpText, id) {
  const field = document.createElement('div');
  field.className = 'settings-field';

  const label = document.createElement('label');
  label.className = 'settings-field__label';
  label.htmlFor = id;

  const text = document.createElement('span');
  text.textContent = labelText;

  const help = document.createElement('p');
  help.className = 'field-help';
  help.id = `${id}-help`;
  help.textContent = helpText;

  label.append(text, help);

  const control = document.createElement('div');
  control.className = 'settings-field__control';

  field.append(label, control);
  return { field, control, helpId: help.id };
}

function createNumberControl(label, value, save, help) {
  const id = nextFieldId();
  const { field, control, helpId } = createField(label, help, id);
  const errorId = `${id}-error`;

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'input';
  input.id = id;
  input.min = '0.1';
  input.step = 'any';
  input.value = String(value);
  input.setAttribute('aria-describedby', `${helpId} ${errorId}`);

  const error = document.createElement('p');
  error.className = 'field-error';
  error.id = errorId;
  error.hidden = true;
  error.setAttribute('role', 'alert');

  input.addEventListener('input', () => {
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  });

  input.addEventListener('change', () => {
    const minutes = Number(input.value);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      input.value = String(value);
      error.textContent = 'Enter a number greater than 0.';
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      return;
    }

    error.hidden = true;
    input.removeAttribute('aria-invalid');

    save(minutes)
      .then(() => {
        value = minutes;
      })
      .catch((failure) => {
        input.value = String(value);
        console.error('Blank Wall duration update failed:', failure);
      });
  });

  control.append(input);
  field.append(error);
  return field;
}

function createTextControl(label, value, maxLength, save, help, onSaved) {
  const id = nextFieldId();
  const { field, control, helpId } = createField(label, help, id);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input';
  input.id = id;
  input.value = value;
  input.maxLength = maxLength;
  input.setAttribute('aria-describedby', helpId);

  input.addEventListener('change', () => {
    const next = input.value.trim();
    save(next)
      .then(() => {
        value = next;
        if (onSaved) {
          onSaved(next);
        }
      })
      .catch((error) => {
        input.value = value;
        console.error('Blank Wall site setting update failed:', error);
      });
  });

  control.append(input);
  return field;
}

function createCounterSiteControl(site, sites, onSaved) {
  const id = nextFieldId();
  const { field, control, helpId } = createField(
    'Counter site',
    'A page to open when you choose a counter-plan.',
    id,
  );
  const errorId = `${id}-error`;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input';
  input.id = id;
  input.value = site.counterSite ?? '';
  input.placeholder = 'example.com';
  input.spellcheck = false;
  input.setAttribute('aria-describedby', `${helpId} ${errorId}`);

  const error = document.createElement('p');
  error.className = 'field-error';
  error.id = errorId;
  error.hidden = true;
  error.setAttribute('role', 'alert');

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  input.addEventListener('input', clearError);

  input.addEventListener('change', () => {
    const parsed = parseCounterSite(input.value);

    if (parsed.error) {
      showError(parsed.error);
      input.value = site.counterSite ?? '';
      return;
    }

    if (parsed.hostname && findBlockedSite(parsed.hostname, sites)) {
      showError('This site is in your blocked list.');
    } else {
      clearError();
    }

    const counterSite = parsed.url;
    input.value = counterSite;
    updateBlockedSite(site.hostname, { counterSite })
      .then(() => {
        site.counterSite = counterSite;
        if (onSaved) {
          onSaved(counterSite);
        }
      })
      .catch((cause) => {
        input.value = site.counterSite ?? '';
        console.error('Blank Wall counter site update failed:', cause);
      });
  });

  control.append(input);
  field.append(error);
  return field;
}

function createToggleControl(label, checked, save, onChange, help) {
  const id = nextFieldId();
  const { field, control, helpId } = createField(label, help, id);
  field.classList.add('settings-field--switch');

  const wrapper = document.createElement('span');
  wrapper.className = 'switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'switch__input';
  input.id = id;
  input.checked = Boolean(checked);
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-describedby', helpId);

  const track = document.createElement('span');
  track.className = 'switch__track';

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

  wrapper.append(input, track);
  control.append(wrapper);
  return field;
}
