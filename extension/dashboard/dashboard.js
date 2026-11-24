import {
  addBlockedSite,
  getBlockedSites,
  getTodayStats,
  removeBlockedSite,
  updateBlockedSite,
} from '../shared/storage.js';
import { normalizeHostname } from '../shared/utils.js';
import { setupHabitsPage } from './habits.js';

const addForm = document.querySelector('#add-site');
const hostnameInput = document.querySelector('#new-hostname');
const siteList = document.querySelector('#site-list');
const emptySites = document.querySelector('#empty-sites');
const walls = document.querySelector('#walls');
const wallTime = document.querySelector('#wall-time');
const skips = document.querySelector('#skips');

setupHabitsPage();

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addSite().catch((error) => {
    console.error('Blank Wall add site failed:', error);
  });
});

hostnameInput.addEventListener('input', () => {
  hostnameInput.setCustomValidity('');
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

  await addBlockedSite(hostname);
  hostnameInput.value = '';
  hostnameInput.setCustomValidity('');
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
    siteList.append(createSiteElement(site));
  }
}

function createSiteElement(site) {
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

  const controls = document.createElement('div');
  controls.className = 'site__controls';
  controls.append(
    createNumberControl('Wall (min)', site.durationMinutes ?? 5, (minutes) =>
      updateBlockedSite(site.hostname, { durationMinutes: minutes })),
    createToggleControl('Notes', site.notesEnabled, (enabled) =>
      updateBlockedSite(site.hostname, { notesEnabled: enabled })),
    createToggleControl('Habits', site.habitsEnabled, (enabled) =>
      updateBlockedSite(site.hostname, { habitsEnabled: enabled })),
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

function createToggleControl(label, checked, save) {
  const wrapper = document.createElement('label');
  wrapper.className = 'control';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.addEventListener('change', () => {
    save(input.checked).catch((error) => {
      input.checked = !input.checked;
      console.error('Blank Wall site setting update failed:', error);
    });
  });

  const text = document.createElement('span');
  text.textContent = label;

  wrapper.append(input, text);
  return wrapper;
}
