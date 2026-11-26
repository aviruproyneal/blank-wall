import { normalizeCounterSite, normalizeHostname, parseHttpUrl } from './utils.js';

const NOTE_LIMIT = 200;
const HABIT_TITLE_LIMIT = 80;
const HABIT_TEXT_LIMIT = 200;
const OCCURRENCE_SITE_LIMIT = 200;
const NOTE_TEXT_LIMIT = 2000;
const MAX_MINUTES = 1440;
const HABIT_ID = /^\d{3,}$/;

export function normalizeImportData(data) {
  const counts = {
    sites: { imported: 0, skipped: 0 },
    habits: { imported: 0, skipped: 0 },
    notes: { imported: 0, skipped: 0 },
  };
  const source = data && typeof data === 'object' ? data : {};
  const blockedSites = normalizeSites(source.blockedSites, counts.sites);
  const habits = normalizeHabits(source.habits, counts.habits);
  const habitIds = new Set(habits.map((habit) => habit.id));
  const notes = normalizeNotes(source.notes, counts.notes, habitIds);

  return { data: { blockedSites, habits, notes }, counts };
}

function normalizeSites(records, counts) {
  const sites = [];
  const seen = new Set();

  for (const record of Array.isArray(records) ? records : []) {
    const hostname = normalizeImportedHostname(record?.hostname);

    if (!hostname || seen.has(hostname)) {
      counts.skipped += 1;
      continue;
    }

    seen.add(hostname);
    const duration = Number(record.durationMinutes);
    const allowance = Number(record.allowanceMinutes);

    sites.push({
      hostname,
      durationMinutes: inRange(duration, 0) && duration > 0 ? duration : 5,
      notesEnabled: readBoolean(record.notesEnabled, true),
      habitsEnabled: readBoolean(record.habitsEnabled, true),
      note: normalizeText(record.note, NOTE_LIMIT),
      counterSite: normalizeCounterSite(record.counterSite),
      allowContinue: readBoolean(record.allowContinue, true),
      allowanceMinutes: inRange(allowance, 1) ? allowance : 15,
    });
    counts.imported += 1;
  }

  return sites;
}

function normalizeHabits(records, counts) {
  const habits = [];
  const seen = new Set();

  for (const record of Array.isArray(records) ? records : []) {
    const id = typeof record?.id === 'string' ? record.id.trim() : '';

    if (!HABIT_ID.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || seen.has(id)) {
      counts.skipped += 1;
      continue;
    }

    seen.add(id);
    habits.push({
      id,
      title: normalizeText(record.title, HABIT_TITLE_LIMIT),
      trigger: normalizeText(record.trigger, HABIT_TEXT_LIMIT),
      response: normalizeText(record.response ?? record.action, HABIT_TEXT_LIMIT),
      reward: normalizeText(record.reward, HABIT_TEXT_LIMIT),
      counterPlan: normalizeText(record.counterPlan, HABIT_TEXT_LIMIT),
      occurrences: normalizeOccurrences(record.occurrences),
    });
    counts.imported += 1;
  }

  return habits;
}

function normalizeOccurrences(records) {
  const occurrences = [];

  for (const record of Array.isArray(records) ? records : []) {
    if (!validTimestamp(record?.timestamp)) {
      continue;
    }

    occurrences.push({
      timestamp: new Date(record.timestamp).toISOString(),
      site: normalizeText(record.site, OCCURRENCE_SITE_LIMIT),
      counterUsed: Boolean(record.counterUsed),
    });
  }

  return occurrences;
}

function normalizeNotes(records, counts, habitIds) {
  const notes = [];
  const seen = new Set();

  for (const record of Array.isArray(records) ? records : []) {
    const id = typeof record?.id === 'string' ? record.id.trim() : '';
    const text = normalizeText(record?.text, NOTE_TEXT_LIMIT);

    if (!id || seen.has(id) || !validTimestamp(record?.timestamp) || !text) {
      counts.skipped += 1;
      continue;
    }

    seen.add(id);
    const habitId = typeof record.habitId === 'string' ? record.habitId.trim() : '';
    const note = {
      id,
      timestamp: new Date(record.timestamp).toISOString(),
      site: normalizeText(record.site, NOTE_LIMIT),
      text,
    };

    if (habitIds.has(habitId)) {
      note.habitId = habitId;
    }

    notes.push(note);
    counts.imported += 1;
  }

  return notes;
}

function normalizeText(value, limit) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function normalizeImportedHostname(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const raw = value.trim();
  // Bare input is assumed to be https, so reject other explicit schemes first.
  if (hasExplicitScheme(raw) && !parseHttpUrl(raw)) {
    return null;
  }
  return normalizeHostname(raw);
}

function hasExplicitScheme(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function readBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function inRange(value, minimum) {
  return Number.isFinite(value) && value >= minimum && value <= MAX_MINUTES;
}
