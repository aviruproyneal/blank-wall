import { getSettings, updateSettings } from '../shared/storage.js';

export function setupSettingsPage() {
  const form = document.querySelector('#settings-form');
  const duration = document.querySelector('#setting-duration');
  const skipRule = document.querySelector('#setting-skip-rule');
  const status = document.querySelector('#settings-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    save().catch((error) => {
      status.textContent = 'Could not save settings.';
      console.error('Blank Wall settings save failed:', error);
    });
  });

  load().catch((error) => {
    status.textContent = 'Could not load settings.';
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
    status.textContent = 'Settings saved.';
  }
}
