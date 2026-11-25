import { getSettings, updateSettings } from '../shared/storage.js';

export function setupSettingsPage() {
  const form = document.querySelector('#settings-form');
  const duration = document.querySelector('#setting-duration');
  const allowance = document.querySelector('#setting-allowance');
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
    allowance.value = String(settings.allowanceMinutes);
    skipRule.value = settings.skipRule;
  }

  async function save() {
    const durationMinutes = Number(duration.value);
    const allowanceMinutes = Number(allowance.value);

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 ||
        !Number.isFinite(allowanceMinutes) || allowanceMinutes < 0) {
      status.textContent = 'Enter a positive duration and a non-negative allowance.';
      return;
    }

    await updateSettings({
      defaultDurationMinutes: durationMinutes,
      allowanceMinutes,
      skipRule: skipRule.value,
    });
    status.textContent = 'Settings saved.';
  }
}
