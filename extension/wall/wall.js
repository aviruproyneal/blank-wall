import {
  getSettings,
  grantAllowance,
  recordWallSeconds,
  recordWallStart,
} from '../shared/storage.js';
import { parseHttpUrl } from '../shared/utils.js';

const params = new URLSearchParams(window.location.search);
const target = parseHttpUrl(params.get('target'));
const allowanceHost = (params.get('site') || target?.hostname || '').toLowerCase();
const durationMinutes = readDuration(params.get('duration'));
const timer = document.querySelector('#timer');
const decision = document.querySelector('#decision');
const continueButton = document.querySelector('#continue');
const leaveButton = document.querySelector('#leave');

const durationSeconds = durationMinutes * 60;
const startedAt = Date.now();
const deadline = startedAt + durationSeconds * 1000;
let finished = false;
let intervalId;

continueButton.disabled = target === null;

recordWallStart().catch((error) => {
  console.error('Blank Wall wall statistics failed:', error);
});

render();
intervalId = window.setInterval(render, 250);

continueButton.addEventListener('click', () => {
  continueToTarget().catch((error) => {
    console.error('Blank Wall continue failed:', error);
  });
});

leaveButton.addEventListener('click', () => {
  window.location.replace('about:blank');
});

async function continueToTarget() {
  if (!target) {
    return;
  }

  const settings = await getSettings();
  await grantAllowance(allowanceHost, settings.allowanceMinutes);
  window.location.assign(target.href);
}

function readDuration(raw) {
  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
}

function render() {
  const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  timer.textContent = formatTime(remaining);

  if (remaining === 0) {
    finish().catch((error) => {
      console.error('Blank Wall wall statistics failed:', error);
    });
  }
}

async function finish() {
  if (finished) {
    return;
  }

  finished = true;
  window.clearInterval(intervalId);
  timer.textContent = '00:00';
  decision.hidden = false;

  const elapsed = Math.min(durationSeconds, Math.floor((Date.now() - startedAt) / 1000));
  await recordWallSeconds(elapsed);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
