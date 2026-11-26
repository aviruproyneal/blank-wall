import { callChromeApi } from '../shared/api.js';
import { backupFolderSupported, getBackupStatus } from '../shared/backup.js';
import {
  addBlockedSite,
  getBlockedSites,
  getTodayStats,
  removeBlockedSite,
} from '../shared/storage.js';
import { findBlockedSite, parseHttpUrl } from '../shared/utils.js';

const BACKUP_LABELS = {
  connected: 'Backup: connected',
  'needs-reconnect': 'Backup: needs reconnect',
  'not-set': 'Backup: not set',
};

function openTab(properties) {
  callChromeApi('tabs.create', properties).catch((error) => {
    console.error('Blank Wall tab open failed:', error);
  });
}

const hostname = document.querySelector('#hostname');
const siteState = document.querySelector('#site-state');
const toggleButton = document.querySelector('#toggle-site');
const walls = document.querySelector('#walls');
const wallTime = document.querySelector('#wall-time');
const skips = document.querySelector('#skips');
const backupStatus = document.querySelector('#backup-status');
const backupStatusText = document.querySelector('#backup-status-text');

let currentHostname = null;
let matchingSite = null;

toggleButton.addEventListener('click', () => {
  updateSiteBlock().catch((error) => {
    console.error('Blank Wall site toggle failed:', error);
  });
});

document.querySelector('#quick-note').addEventListener('click', () => {
  openDashboard('notes');
});

document.querySelector('#log-habit').addEventListener('click', () => {
  openDashboard('habits');
});

document.querySelector('#open-dashboard').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.querySelector('#open-guide').addEventListener('click', () => {
  openTab({ url: chrome.runtime.getURL('guide/guide.html') });
});

function openDashboard(section) {
  const url = chrome.runtime.getURL('dashboard/dashboard.html');
  openTab({ url: `${url}#${section}` });
}

function setToggleLabel(blocked) {
  toggleButton.textContent = blocked ? 'Unblock' : 'Block this site';
  toggleButton.classList.toggle('button--primary', !blocked);
  toggleButton.classList.toggle('button--secondary', blocked);
}

renderStats().catch((error) => {
  console.error('Blank Wall popup statistics failed:', error);
});

renderSiteState().catch((error) => {
  console.error('Blank Wall popup site lookup failed:', error);
});

renderBackupStatus().catch((error) => {
  console.error('Blank Wall popup backup status failed:', error);
});

async function updateSiteBlock() {
  if (!currentHostname) {
    return;
  }

  toggleButton.disabled = true;

  try {
    if (matchingSite) {
      await removeBlockedSite(matchingSite.hostname);
    } else {
      await addBlockedSite(currentHostname);
    }
    await renderSiteState();
  } finally {
    if (currentHostname) {
      toggleButton.disabled = false;
    }
  }
}

async function renderSiteState() {
  const [tab] = await callChromeApi('tabs.query', { active: true, currentWindow: true });
  const url = parseHttpUrl(tab?.url);
  currentHostname = url?.hostname ?? null;

  if (!currentHostname) {
    hostname.textContent = 'This page cannot be blocked';
    siteState.textContent = 'Unavailable';
    matchingSite = null;
    setToggleLabel(false);
    toggleButton.disabled = true;
    return;
  }

  const sites = await getBlockedSites();
  matchingSite = findBlockedSite(currentHostname, sites);

  hostname.textContent = currentHostname;
  siteState.textContent = matchingSite ? `Blocked via ${matchingSite.hostname}` : 'Not blocked';
  setToggleLabel(Boolean(matchingSite));
  toggleButton.disabled = false;
}

async function renderStats() {
  const stats = await getTodayStats();
  walls.textContent = String(stats.walls);
  wallTime.textContent = `${Math.round(stats.wallSeconds / 60)} min`;
  skips.textContent = String(stats.skips);
}

async function renderBackupStatus() {
  if (!backupFolderSupported()) {
    backupStatus.dataset.state = 'muted';
    backupStatusText.textContent = 'Backup: export only';
    return;
  }

  const state = await getBackupStatus();
  backupStatus.dataset.state = state;
  backupStatusText.textContent = BACKUP_LABELS[state];
}
