import { enqueueChange, flushPendingChanges } from './backup.js';
import { formatTimestamp } from './utils.js';

function defaultState() {
  return {
    blockedSites: [],
    habits: [],
    notes: [],
    stats: {},
    allowances: {},
    nextHabitNumber: 1,
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

function noteDay(timestamp) {
  return formatTimestamp(timestamp).slice(0, 10);
}

async function mirror(change) {
  try {
    await enqueueChange(change);
    await flushPendingChanges();
  } catch (error) {
    console.error('Blank Wall backup update failed:', error);
  }
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

export async function updateSettings(patch) {
  const settings = await getSettings();
  await chrome.storage.local.set({ settings: { ...settings, ...patch } });
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
    await mirror({ type: 'blocked-sites', sites });
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
  await mirror({ type: 'blocked-sites', sites });
}

export async function removeBlockedSite(hostname) {
  const host = hostname.toLowerCase();
  const sites = (await getBlockedSites()).filter((site) => site.hostname.toLowerCase() !== host);
  await chrome.storage.local.set({ blockedSites: sites });
  await mirror({ type: 'blocked-sites', sites });
}

export async function getTodayStats() {
  const { stats = {} } = await chrome.storage.local.get('stats');
  return { walls: 0, wallSeconds: 0, skips: 0, ...stats[todayKey()] };
}

export async function getNotes() {
  const { notes = [] } = await chrome.storage.local.get('notes');
  return notes;
}

async function mirrorNotes(notes, timestamp) {
  const day = noteDay(timestamp);
  await mirror({
    type: 'notes',
    day,
    notes: notes.filter((note) => noteDay(note.timestamp) === day),
  });
}

export async function addNote(text, site, habitId = null) {
  const { notes = [] } = await chrome.storage.local.get('notes');
  const note = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    site,
    text,
  };

  if (habitId) {
    note.habitId = habitId;
  }

  notes.push(note);
  await chrome.storage.local.set({ notes });
  await mirrorNotes(notes, note.timestamp);
  return note;
}

export async function updateNote(id, patch) {
  const { notes = [] } = await chrome.storage.local.get('notes');
  const note = notes.find((candidate) => candidate.id === id);

  if (note) {
    Object.assign(note, patch);
    if (!note.habitId) {
      delete note.habitId;
    }
    await chrome.storage.local.set({ notes });
    await mirrorNotes(notes, note.timestamp);
  }
}

export async function deleteNote(id) {
  const { notes = [] } = await chrome.storage.local.get('notes');
  const removed = notes.find((note) => note.id === id);
  const remaining = notes.filter((note) => note.id !== id);
  await chrome.storage.local.set({ notes: remaining });

  if (removed) {
    await mirrorNotes(remaining, removed.timestamp);
  }
}

export async function getHabits() {
  const { habits = [] } = await chrome.storage.local.get('habits');
  return habits;
}

export async function addHabit(details, occurrence = null) {
  const habits = await getHabits();
  const { nextHabitNumber = 1 } = await chrome.storage.local.get('nextHabitNumber');
  const { id, nextNumber } = nextHabitId(habits, nextHabitNumber);
  const habit = {
    id,
    title: details.title,
    trigger: details.trigger,
    action: details.action,
    reward: details.reward,
    counterPlan: details.counterPlan,
    occurrences: occurrence ? [createOccurrence(occurrence)] : [],
  };
  habits.push(habit);
  await chrome.storage.local.set({ habits, nextHabitNumber: nextNumber });
  await mirror({ type: 'habit', habit });
  return habit;
}

export async function updateHabit(id, patch) {
  const habits = await getHabits();
  const habit = habits.find((candidate) => candidate.id === id);

  if (habit) {
    const previousTitle = habit.title;
    Object.assign(habit, patch);
    await chrome.storage.local.set({ habits });
    await mirror({ type: 'habit', habit, previousTitle });
  }
}

export async function deleteHabit(id) {
  const habits = await getHabits();
  const { notes = [] } = await chrome.storage.local.get('notes');
  const removed = habits.find((habit) => habit.id === id);
  const remaining = habits.filter((habit) => habit.id !== id);
  const updatedNotes = notes.map((note) => {
    if (note.habitId !== id) {
      return note;
    }
    const updated = { ...note };
    delete updated.habitId;
    return updated;
  });
  await chrome.storage.local.set({ habits: remaining, notes: updatedNotes });

  if (removed) {
    await mirror({ type: 'habit-delete', id: removed.id, title: removed.title });
  }

  for (const note of notes) {
    if (note.habitId === id) {
      await mirrorNotes(updatedNotes, note.timestamp);
    }
  }
}

export async function addOccurrence(id, occurrence) {
  const habits = await getHabits();
  const habit = habits.find((candidate) => candidate.id === id);

  if (habit) {
    habit.occurrences.push(createOccurrence(occurrence));
    await chrome.storage.local.set({ habits });
    await mirror({ type: 'habit', habit });
  }
}

function nextHabitId(habits, nextNumber) {
  const highest = habits.reduce((max, habit) => {
    const number = Number(habit.id);
    return Number.isInteger(number) && number > max ? number : max;
  }, 0);
  const number = Math.max(nextNumber, highest + 1);
  return { id: String(number).padStart(3, '0'), nextNumber: number + 1 };
}

function createOccurrence({ site, counterUsed }) {
  return {
    timestamp: new Date().toISOString(),
    site,
    counterUsed: Boolean(counterUsed),
  };
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

export function recordSkip() {
  return updateTodayStats((day) => ({ ...day, skips: day.skips + 1 }));
}
