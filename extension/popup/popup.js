import {
  addBlockedSite,
  getBlockedSites,
  getTodayStats,
  removeBlockedSite,
} from '../shared/storage.js';
import { parseHttpUrl } from '../shared/utils.js';

const hostname = document.querySelector('#hostname');
const toggleButton = document.querySelector('#toggle-site');
const walls = document.querySelector('#walls');
const wallTime = document.querySelector('#wall-time');
const skips = document.querySelector('#skips');

let currentHostname = null;
let isBlocked = false;

toggleButton.addEventListener('click', () => {
  updateSiteBlock().catch((error) => {
    console.error('Blank Wall site toggle failed:', error);
  });
});

document.querySelector('#open-dashboard').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

renderStats().catch((error) => {
  console.error('Blank Wall popup statistics failed:', error);
});

renderSiteState().catch((error) => {
  console.error('Blank Wall popup site lookup failed:', error);
});

async function updateSiteBlock() {
  if (!currentHostname) {
    return;
  }

  toggleButton.disabled = true;

  try {
    if (isBlocked) {
      await removeBlockedSite(currentHostname);
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = parseHttpUrl(tab?.url);
  currentHostname = url?.hostname ?? null;

  if (!currentHostname) {
    hostname.textContent = 'This page cannot be blocked';
    isBlocked = false;
    toggleButton.textContent = 'Block this site';
    toggleButton.disabled = true;
    return;
  }

  const sites = await getBlockedSites();
  isBlocked = sites.some((site) => site.hostname.toLowerCase() === currentHostname);

  hostname.textContent = currentHostname;
  toggleButton.textContent = isBlocked ? 'Unblock this site' : 'Block this site';
  toggleButton.disabled = false;
}

async function renderStats() {
  const stats = await getTodayStats();
  walls.textContent = String(stats.walls);
  wallTime.textContent = `${Math.round(stats.wallSeconds / 60)} min`;
  skips.textContent = String(stats.skips);
}
