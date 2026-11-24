import {
  getBlockedSites,
  getSettings,
  hasAllowance,
  initializeStorage,
} from './shared/storage.js';
import { parseHttpUrl } from './shared/utils.js';

const DEV_BLOCKED_SITES = [
  {
    hostname: 'example.com',
    durationMinutes: 1,
    notesEnabled: true,
    habitsEnabled: false,
  },
];

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage().catch((error) => {
    console.error('Blank Wall storage initialization failed:', error);
  });
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  redirectIfBlocked(details).catch((error) => {
    console.error('Blank Wall navigation check failed:', error);
  });
});

async function redirectIfBlocked(details) {
  if (details.frameId !== 0 || details.tabId < 0) {
    return;
  }

  const target = parseHttpUrl(details.url);
  if (!target) {
    return;
  }

  const configuredSites = await getBlockedSites();
  const sites = configuredSites.length > 0 ? configuredSites : DEV_BLOCKED_SITES;
  const site = sites.find((candidate) => isSubdomainOf(target.hostname, candidate.hostname));

  if (!site || (await hasAllowance(site.hostname))) {
    return;
  }

  const settings = await getSettings();
  const wall = new URL(chrome.runtime.getURL('wall/wall.html'));
  wall.searchParams.set('target', target.href);
  wall.searchParams.set('site', site.hostname);
  wall.searchParams.set('duration', String(site.durationMinutes ?? settings.defaultDurationMinutes));
  wall.searchParams.set('notes', site.notesEnabled ? '1' : '0');

  await chrome.tabs.update(details.tabId, { url: wall.href });
}

function isSubdomainOf(hostname, siteHostname) {
  const host = hostname.toLowerCase();
  const site = siteHostname.toLowerCase();
  return host === site || host.endsWith(`.${site}`);
}
