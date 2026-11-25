import { backupFolderSupported, readBackupFolder } from '../shared/backup.js';
import { getAllData, importBackupData } from '../shared/storage.js';

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
    const data = await getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blank-wall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    message.textContent = 'Export downloaded.';
  }

  async function importFolder() {
    const backup = await readBackupFolder();

    if (!backup) {
      message.textContent = 'No backup data found in the connected folder.';
      return;
    }

    const confirmed = window.confirm(
      'Replace the current notes, habits, and blocked sites with the backup folder data?',
    );
    if (!confirmed) {
      return;
    }

    await importBackupData(backup);
    window.location.reload();
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

      const confirmed = window.confirm(
        'Replace the current notes, habits, and blocked sites with this JSON backup?',
      );
      if (!confirmed) {
        return;
      }

      await importBackupData(data);
      message.textContent = 'JSON backup imported.';
      window.location.reload();
    } finally {
      importJsonFileInput.value = '';
    }
  }

  function reportError(label, context) {
    return (error) => {
      message.textContent = label;
      console.error(`Blank Wall ${context} failed:`, error);
    };
  }
}
