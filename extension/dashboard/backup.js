import {
  chooseBackupFolder,
  getBackupStatus,
  reconnectBackupFolder,
} from '../shared/backup.js';

const STATUS_LABELS = {
  connected: 'Connected',
  'needs-reconnect': 'Needs reconnect',
  'not-set': 'Not set',
};

export function setupBackupUI() {
  const onboarding = document.querySelector('#backup-onboarding');
  const onboardingChoose = document.querySelector('#onboarding-choose-folder');
  const skipOnboarding = document.querySelector('#skip-backup');
  const reminder = document.querySelector('#backup-reminder');
  const reminderMessage = document.querySelector('#backup-reminder-message');
  const status = document.querySelector('#backup-status');
  const message = document.querySelector('#backup-message');
  const choose = document.querySelector('#choose-backup-folder');
  const reconnect = document.querySelector('#reconnect-backup-folder');

  onboardingChoose.addEventListener('click', () => {
    connect().catch(reportError('Could not connect the backup folder.', 'backup folder selection'));
  });

  choose.addEventListener('click', () => {
    connect().catch(reportError('Could not connect the backup folder.', 'backup folder selection'));
  });

  reconnect.addEventListener('click', () => {
    reconnectFolder().catch(reportError('Could not reconnect the backup folder.', 'backup folder reconnect'));
  });

  skipOnboarding.addEventListener('click', () => {
    onboarding.hidden = true;
    history.replaceState(null, '', chrome.runtime.getURL('dashboard/dashboard.html'));
    refresh().catch(reportError('Could not check backup status.', 'backup status'));
  });

  if (new URLSearchParams(window.location.search).has('welcome')) {
    onboarding.hidden = false;
  }

  refresh().catch(reportError('Could not check backup status.', 'backup status'));

  async function connect() {
    if (typeof window.showDirectoryPicker !== 'function') {
      message.textContent = 'This browser cannot choose a folder.';
      return;
    }

    try {
      await chooseBackupFolder();
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
      return;
    }

    onboarding.hidden = true;
    message.textContent = 'Backup folder connected.';
    await refresh();
  }

  async function reconnectFolder() {
    const state = await reconnectBackupFolder();
    message.textContent = state === 'connected' ? 'Backup folder reconnected.' : '';
    await refresh();
  }

  async function refresh() {
    const state = await getBackupStatus();
    status.textContent = STATUS_LABELS[state];
    reconnect.hidden = state !== 'needs-reconnect';
    reminder.hidden = !onboarding.hidden || state === 'connected';
    reminderMessage.textContent = state === 'not-set'
      ? 'No backup folder is connected.'
      : 'The backup folder needs reconnecting.';
  }

  function reportError(label, context) {
    return (error) => {
      message.textContent = label;
      console.error(`Blank Wall ${context} failed:`, error);
    };
  }
}
