import { getSettings, updateSettings } from '../shared/storage.js';
import { showToast } from '../shared/ui.js';

export function setupSettingsPage() {
  const form = document.querySelector('#settings-form');
  const duration = document.querySelector('#setting-duration');
  const skipRule = document.querySelector('#setting-skip-rule');
  const status = document.querySelector('#settings-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    save().catch((error) => {
      showToast('Could not save settings.', 'danger');
      console.error('Blank Wall settings save failed:', error);
    });
  });

  load().catch((error) => {
    showToast('Could not load settings.', 'danger');
    console.error('Blank Wall settings load failed:', error);
  });

  async function load() {
    const settings = await getSettings();
    duration.value = String(settings.defaultDurationMinutes);
    skipRule.value = settings.skipRule;
  }

  async function save() {
    const durationMinutes = Number(duration.value);

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      status.textContent = 'Enter a positive duration.';
      return;
    }

    await updateSettings({
      defaultDurationMinutes: durationMinutes,
      skipRule: skipRule.value,
    });
    status.textContent = '';
    showToast('Settings saved.', 'success');
  }
}
