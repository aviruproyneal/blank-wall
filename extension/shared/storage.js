function defaultState() {
  return {
    blockedSites: [],
    habits: [],
    notes: [],
    stats: {},
    allowances: {},
    settings: {
      defaultDurationMinutes: 5,
      allowanceMinutes: 15,
      skipRule: 'none',
    },
  };
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function initializeStorage() {
  const defaults = defaultState();
  const stored = await chrome.storage.local.get(Object.keys(defaults));
  const missing = {};

  for (const [key, value] of Object.entries(defaults)) {
    if (stored[key] === undefined) {
      missing[key] = value;
    }
  }

  if (Object.keys(missing).length > 0) {
    await chrome.storage.local.set(missing);
  }
}

export async function getSettings() {
  const defaults = defaultState();
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...defaults.settings, ...settings };
}

export async function getBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  return blockedSites;
}

export async function addBlockedSite(hostname) {
  const host = hostname.toLowerCase();
  const sites = await getBlockedSites();
  const settings = await getSettings();

  if (!sites.some((site) => site.hostname.toLowerCase() === host)) {
    sites.push({
      hostname: host,
      durationMinutes: settings.defaultDurationMinutes,
      notesEnabled: true,
      habitsEnabled: true,
    });
    await chrome.storage.local.set({ blockedSites: sites });
  }

  await revokeAllowance(host);
}

export async function updateBlockedSite(hostname, patch) {
  const host = hostname.toLowerCase();
  const sites = await getBlockedSites();
  const index = sites.findIndex((site) => site.hostname.toLowerCase() === host);

  if (index === -1) {
    return;
  }

  sites[index] = { ...sites[index], ...patch };
  await chrome.storage.local.set({ blockedSites: sites });
}

export async function removeBlockedSite(hostname) {
  const host = hostname.toLowerCase();
  const sites = (await getBlockedSites()).filter((site) => site.hostname.toLowerCase() !== host);
  await chrome.storage.local.set({ blockedSites: sites });
}

export async function getTodayStats() {
  const { stats = {} } = await chrome.storage.local.get('stats');
  return { walls: 0, wallSeconds: 0, skips: 0, ...stats[todayKey()] };
}

export async function hasAllowance(hostname) {
  const host = hostname.toLowerCase();
  const { allowances = {} } = await chrome.storage.local.get('allowances');
  const expiresAt = allowances[host];

  if (expiresAt === undefined) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    await revokeAllowance(host);
    return false;
  }

  return true;
}

export async function grantAllowance(hostname, minutes) {
  const host = hostname.toLowerCase();
  const { allowances = {} } = await chrome.storage.local.get('allowances');
  allowances[host] = Date.now() + minutes * 60_000;
  await chrome.storage.local.set({ allowances });
}

export async function revokeAllowance(hostname) {
  const host = hostname.toLowerCase();
  const { allowances = {} } = await chrome.storage.local.get('allowances');

  if (allowances[host] !== undefined) {
    delete allowances[host];
    await chrome.storage.local.set({ allowances });
  }
}

async function updateTodayStats(update) {
  const { stats = {} } = await chrome.storage.local.get('stats');
  const key = todayKey();
  const day = { walls: 0, wallSeconds: 0, skips: 0, ...stats[key] };

  stats[key] = update(day);
  await chrome.storage.local.set({ stats });
}

export function recordWallStart() {
  return updateTodayStats((day) => ({ ...day, walls: day.walls + 1 }));
}

export function recordWallSeconds(seconds) {
  const rounded = Math.round(seconds);
  if (rounded <= 0) {
    return Promise.resolve();
  }
  return updateTodayStats((day) => ({ ...day, wallSeconds: day.wallSeconds + rounded }));
}
