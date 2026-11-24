function defaultState() {
  return {
    blockedSites: [],
    habits: [],
    notes: [],
    stats: {},
    settings: {
      defaultDurationMinutes: 5,
      allowanceMinutes: 15,
      skipRule: 'none',
    },
  };
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
