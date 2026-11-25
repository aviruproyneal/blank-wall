import { readBackupFolder } from '../shared/backup.js';
import { getAllData, importBackupData } from '../shared/storage.js';

export function setupDataTransferUI() {
  const exportButton = document.querySelector('#export-data');
  const importButton = document.querySelector('#import-data');
  const message = document.querySelector('#data-transfer-message');

  exportButton.addEventListener('click', () => {
    exportAll().catch(reportError('Could not export data.', 'export'));
  });

  importButton.addEventListener('click', () => {
    importFolder().catch(reportError('Could not import data.', 'import'));
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

  function reportError(label, context) {
    return (error) => {
      message.textContent = label;
      console.error(`Blank Wall ${context} failed:`, error);
    };
  }
}
