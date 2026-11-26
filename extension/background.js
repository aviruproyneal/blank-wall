import { callChromeApi } from './shared/api.js';
import {
  getBlockedSites,
  hasAllowance,
  initializeStorage,
  migrateStorage,
} from './shared/storage.js';
import { parseHttpUrl } from './shared/utils.js';

chrome.runtime.onInstalled.addListener((details) => {
  const ready = details.reason === 'update' ? migrateStorage() : Promise.resolve();

  ready
    .then(() => initializeStorage())
    .then(() => {
      if (details.reason === 'install') {
        return callChromeApi('tabs.create', {
          url: chrome.runtime.getURL('dashboard/dashboard.html?welcome=1'),
        });
      }
      return undefined;
    })
    .catch((error) => {
      console.error('Blank Wall installation setup failed:', error);
    });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'close-tab' && sender.tab?.id !== undefined) {
    callChromeApi('tabs.remove', sender.tab.id).catch((error) => {
      console.error('Blank Wall tab close failed:', error);
    });
  }
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

  const sites = await getBlockedSites();
  const site = sites.find((candidate) => isSubdomainOf(target.hostname, candidate.hostname));

  if (!site || (await hasAllowance(site.hostname))) {
    return;
  }

  const wall = new URL(chrome.runtime.getURL('wall/wall.html'));
  wall.searchParams.set('target', target.href);
  wall.searchParams.set('site', site.hostname);

  await callChromeApi('tabs.update', details.tabId, { url: wall.href });
}

function isSubdomainOf(hostname, siteHostname) {
  const host = hostname.toLowerCase();
  const site = siteHostname.toLowerCase();
  return host === site || host.endsWith(`.${site}`);
}
