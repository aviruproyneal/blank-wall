import { formatTimestamp } from './utils.js';

const DATABASE_NAME = 'blank-wall-backup';
const STORE_NAME = 'state';
const DIRECTORY_HANDLE_KEY = 'directoryHandle';
const PENDING_CHANGES_KEY = 'pendingChanges';

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

function renderNotes(day, notes) {
  const lines = [`# ${day}`, ''];

  for (const note of notes) {
    const source = note.site || 'Wall';
    const habit = note.habitId ? ` · #${note.habitId}` : '';
    lines.push(`## ${formatTimestamp(note.timestamp)} · ${source}${habit}`, '', note.text, '');
  }

  return lines.join('\n');
}

function renderHabit(habit) {
  const lines = [
    '---',
    `id: ${frontMatterValue(habit.id)}`,
    `trigger: ${frontMatterValue(habit.trigger)}`,
    `action: ${frontMatterValue(habit.action)}`,
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
