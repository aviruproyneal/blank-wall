import { backupFolderSupported, readBackupFolder } from '../shared/backup.js';
import { getAllData, importBackupData } from '../shared/storage.js';
import { askConfirm } from '../shared/ui.js';

const IMPORT_RESULT_KEY = 'blank-wall:import-result';

export function setupDataTransferUI() {
  const exportButton = document.querySelector('#export-data');
  const importButton = document.querySelector('#import-data');
  const importJsonButton = document.querySelector('#import-json');
  const importJsonFileInput = document.querySelector('#import-json-file');
  const folderImportUnsupported = document.querySelector('#folder-import-unsupported');
  const message = document.querySelector('#data-transfer-message');

  if (!backupFolderSupported()) {
    importButton.hidden = true;
    folderImportUnsupported.hidden = false;
  }

  const savedMessage = consumeImportMessage();
  if (savedMessage) {
    message.textContent = savedMessage;
  }

  exportButton.addEventListener('click', () => {
    exportAll().catch(reportError('Could not export data.', 'export'));
  });

  importButton.addEventListener('click', () => {
    importFolder().catch(reportError('Could not import data.', 'import'));
  });

  importJsonButton.addEventListener('click', () => {
    importJsonFileInput.click();
  });

  importJsonFileInput.addEventListener('change', () => {
    importJsonFile().catch(reportError('Could not import JSON backup.', 'JSON import'));
  });

  async function exportAll() {
    await downloadSnapshot();
    message.textContent = 'Export downloaded.';
  }

  async function importFolder() {
    const backup = await readBackupFolder();

    if (!backup) {
      message.textContent = 'No backup data found in the connected folder.';
      return;
    }

    await replaceData('the backup folder data', backup);
  }

  async function importJsonFile() {
    const file = importJsonFileInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const data = JSON.parse(await file.text());
      const keys = ['blockedSites', 'habits', 'notes'];
      const present = data && typeof data === 'object'
        ? keys.filter((key) => key in data)
        : [];
      const hasContent = present.length > 0 && present.every((key) => Array.isArray(data[key]));

      if (!hasContent) {
        throw new Error('The selected file is not a Blank Wall backup.');
      }

      await replaceData('this JSON backup', data);
    } finally {
      importJsonFileInput.value = '';
    }
  }

  async function replaceData(label, backup) {
    const confirmed = await askConfirm({
      title: 'Replace data?',
      message: `Replace the current notes, habits, and blocked sites with ${label}?`,
      confirmLabel: 'Replace',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    const snapshotStarted = await startSafetySnapshot();
    if (!snapshotStarted) {
      const accepted = await askConfirm({
        title: 'Safety snapshot failed',
        message: 'The safety snapshot could not be downloaded. Replace the current data anyway?',
        confirmLabel: 'Replace anyway',
        danger: true,
      });
      if (!accepted) {
        return;
      }
    }

    const counts = await importBackupData(backup);
    finishImport(counts);
  }

  async function startSafetySnapshot() {
    try {
      await downloadSnapshot();
      return true;
    } catch (error) {
      console.error('Blank Wall safety snapshot failed:', error);
      return false;
    }
  }

  async function downloadSnapshot() {
    const data = await getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    try {
      link.href = url;
      link.download = `blank-wall-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  function finishImport(counts) {
    const text = formatImportResult(counts);
    if (rememberImportMessage(text)) {
      window.location.reload();
      return;
    }
    message.textContent = text;
  }

  function reportError(label, context) {
    return (error) => {
      message.textContent = label;
      console.error(`Blank Wall ${context} failed:`, error);
    };
  }
}

function formatImportResult(counts) {
  const part = (label, result) => `${result.imported} ${label} (${result.skipped} skipped)`;
  return `Imported ${part('sites', counts.sites)}, ${part('habits', counts.habits)}, ${part('notes', counts.notes)}.`;
}

function consumeImportMessage() {
  try {
    const text = window.sessionStorage.getItem(IMPORT_RESULT_KEY);
    if (text) {
      window.sessionStorage.removeItem(IMPORT_RESULT_KEY);
    }
    return text;
  } catch {
    return null;
  }
}

function rememberImportMessage(text) {
  try {
    window.sessionStorage.setItem(IMPORT_RESULT_KEY, text);
    return true;
  } catch {
    return false;
  }
}
