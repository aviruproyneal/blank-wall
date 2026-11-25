const DATABASE_NAME = 'blank-wall-backup';
const STORE_NAME = 'state';
const DIRECTORY_HANDLE_KEY = 'directoryHandle';

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
