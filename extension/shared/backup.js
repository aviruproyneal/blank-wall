import { formatTimestamp } from './utils.js';

const DATABASE_NAME = 'blank-wall-backup';
const STORE_NAME = 'state';
const DIRECTORY_HANDLE_KEY = 'directoryHandle';
const PENDING_CHANGES_KEY = 'pendingChanges';

export function backupFolderSupported() {
  return typeof window.showDirectoryPicker === 'function';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readValue(key) {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function writeValue(key, value) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function getBackupStatus() {
  const handle = await readValue(DIRECTORY_HANDLE_KEY);

  if (!handle) {
    return 'not-set';
  }

  let permission;
  try {
    permission = await handle.queryPermission({ mode: 'readwrite' });
  } catch {
    // A stale handle can throw instead of returning a permission.
    return 'needs-reconnect';
  }

  return permission === 'granted' ? 'connected' : 'needs-reconnect';
}

export async function chooseBackupFolder() {
  if (!backupFolderSupported()) {
    throw new Error('Folder backup is not supported in this browser.');
  }

  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await writeValue(DIRECTORY_HANDLE_KEY, handle);
}

export async function reconnectBackupFolder() {
  const handle = await readValue(DIRECTORY_HANDLE_KEY);

  if (!handle) {
    return 'not-set';
  }

  const permission = await handle.requestPermission({ mode: 'readwrite' });
  return permission === 'granted' ? 'connected' : 'needs-reconnect';
}

export async function enqueueChange(change) {
  const pending = (await readValue(PENDING_CHANGES_KEY)) ?? [];
  pending.push(change);
  await writeValue(PENDING_CHANGES_KEY, pending);
}

export async function flushPendingChanges() {
  const directory = await getWritableDirectory();

  if (!directory) {
    return false;
  }

  const root = await directory.getDirectoryHandle('BlankWall', { create: true });
  const pending = (await readValue(PENDING_CHANGES_KEY)) ?? [];
  const remaining = [...pending];

  while (remaining.length > 0) {
    try {
      await applyChange(root, remaining[0]);
    } catch (error) {
      console.error('Blank Wall backup write failed:', error);
      break;
    }

    remaining.shift();
    await writeValue(PENDING_CHANGES_KEY, remaining);
  }

  return remaining.length === 0;
}

async function getWritableDirectory() {
  const handle = await readValue(DIRECTORY_HANDLE_KEY);

  if (!handle) {
    return null;
  }

  try {
    if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
      return null;
    }
  } catch {
    return null;
  }

  return handle;
}

async function applyChange(root, change) {
  if (change.type === 'notes') {
    const notes = await root.getDirectoryHandle('notes', { create: true });
    await writeText(notes, `${change.day}.md`, renderNotes(change.day, change.notes));
    return;
  }

  if (change.type === 'habit') {
    const habits = await root.getDirectoryHandle('habits', { create: true });
    const name = habitFileName(change.habit);
    const previous = change.previousTitle
      ? habitFileName({ ...change.habit, title: change.previousTitle })
      : null;

    if (previous && previous !== name) {
      await removeFile(habits, previous);
    }

    await writeText(habits, name, renderHabit(change.habit));
    return;
  }

  if (change.type === 'habit-delete') {
    const habits = await root.getDirectoryHandle('habits', { create: true });
    await removeFile(habits, habitFileName({ id: change.id, title: change.title }));
    return;
  }

  if (change.type === 'blocked-sites') {
    await writeText(root, 'blocked-sites.json', `${JSON.stringify(change.sites, null, 2)}\n`);
  }
}

function habitFileName(habit) {
  const slug = String(habit.title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return `${habit.id}-${slug || 'untitled'}.md`;
}

export function renderNotes(day, notes) {
  const lines = [`# ${day}`, ''];

  for (const note of notes) {
    const source = note.site || 'Wall';
    const habit = note.habitId ? ` · #${note.habitId}` : '';
    lines.push(`## ${formatTimestamp(note.timestamp)} · ${source}${habit}`, '', note.text, '');
  }

  return lines.join('\n');
}

export function renderHabit(habit) {
  const lines = [
    '---',
    `id: ${frontMatterValue(habit.id)}`,
    `title: ${frontMatterValue(habit.title)}`,
    `trigger: ${frontMatterValue(habit.trigger)}`,
    `response: ${frontMatterValue(habit.response)}`,
    `reward: ${frontMatterValue(habit.reward)}`,
    `counter: ${frontMatterValue(habit.counterPlan)}`,
    `occurrences: ${habit.occurrences.length}`,
    `counter_used: ${habit.occurrences.filter((entry) => entry.counterUsed).length}`,
    '---',
    '',
    '## Log',
    ...habit.occurrences.map((entry) =>
      `- ${formatTimestamp(entry.timestamp)}, counter used: ${entry.counterUsed ? 'yes' : 'no'}`),
    '',
  ];
  return lines.join('\n');
}

function frontMatterValue(value) {
  const text = String(value ?? '');
  return text.trim() === text && /^[\w -]+$/.test(text) ? text : JSON.stringify(text);
}

async function writeText(directory, name, content) {
  const file = await directory.getFileHandle(name, { create: true });
  const writable = await file.createWritable();

  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function removeFile(directory, name) {
  try {
    await directory.removeEntry(name);
  } catch (error) {
    if (error.name !== 'NotFoundError') {
      throw error;
    }
  }
}

export async function readBackupFolder() {
  const directory = await getWritableDirectory();

  if (!directory) {
    return null;
  }

  const root = await getOptionalDirectory(directory, 'BlankWall');

  if (!root) {
    return null;
  }

  const [blockedSites, habits, notes] = await Promise.all([
    readJson(root, 'blocked-sites.json'),
    readHabits(root),
    readNotes(root),
  ]);
  return { blockedSites, habits, notes };
}

async function getOptionalDirectory(directory, name) {
  try {
    return await directory.getDirectoryHandle(name);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

async function readJson(directory, name) {
  try {
    const file = await directory.getFileHandle(name);
    return JSON.parse(await (await file.getFile()).text());
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return [];
    }
    throw error;
  }
}

async function readHabits(root) {
  const directory = await getOptionalDirectory(root, 'habits');

  if (!directory) {
    return [];
  }

  const habits = [];
  for await (const [name, entry] of directory.entries()) {
    if (entry.kind !== 'file' || !name.endsWith('.md')) {
      continue;
    }
    const habit = parseHabit(await (await entry.getFile()).text(), name);
    if (habit) {
      habits.push(habit);
    }
  }
  return habits.sort((first, second) => Number(first.id) - Number(second.id));
}

async function readNotes(root) {
  const directory = await getOptionalDirectory(root, 'notes');

  if (!directory) {
    return [];
  }

  const notes = [];
  for await (const [name, entry] of directory.entries()) {
    if (entry.kind !== 'file' || !name.endsWith('.md')) {
      continue;
    }
    notes.push(...parseNotes(await (await entry.getFile()).text()));
  }
  return notes.sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp));
}

export function parseHabit(text, fileName) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') {
    return null;
  }

  const front = {};
  let index = 1;
  while (index < lines.length && lines[index] !== '---') {
    const separator = lines[index].indexOf(':');
    if (separator > 0) {
      const key = lines[index].slice(0, separator).trim();
      front[key] = parseFrontMatterValue(lines[index].slice(separator + 1).trim());
    }
    index += 1;
  }

  const id = front.id || fileName.match(/^(\d+)-/)?.[1];
  if (!id) {
    return null;
  }

  const occurrences = [];
  for (const line of lines.slice(index + 1)) {
    const match = line.match(/^- (\d{4}-\d{2}-\d{2} \d{2}:\d{2}), counter used: (yes|no)$/);
    if (match) {
      occurrences.push({
        timestamp: parseLocalTimestamp(match[1]),
        site: '',
        counterUsed: match[2] === 'yes',
      });
    }
  }

  return {
    id: String(id),
    title: front.title || fileName.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '),
    trigger: front.trigger || '',
    response: front.response || front.action || '',
    reward: front.reward || '',
    counterPlan: front.counter || '',
    occurrences,
  };
}

export function parseNotes(text) {
  const lines = text.split(/\r?\n/);
  const notes = [];
  let current = null;

  for (const line of lines.slice(1)) {
    const heading = line.match(/^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · (.+?)(?: · (#\d+))?$/);
    if (heading) {
      if (current) {
        notes.push(current);
      }
      const [, timestamp, source, habitId] = heading;
      current = {
        id: crypto.randomUUID(),
        timestamp: parseLocalTimestamp(timestamp),
        site: source === 'Wall' ? '' : source,
        text: '',
      };
      if (habitId) {
        current.habitId = habitId.slice(1);
      }
      continue;
    }
    if (current) {
      current.text += `${line}\n`;
    }
  }

  if (current) {
    notes.push(current);
  }

  return notes.filter((note) => note.text.trim()).map((note) => ({ ...note, text: note.text.trim() }));
}

function parseLocalTimestamp(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) {
    return new Date().toISOString();
  }
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).toISOString();
}

function parseFrontMatterValue(raw) {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
