import {
  getSettings,
  grantAllowance,
  recordSkip,
  recordWallSeconds,
  recordWallStart,
} from '../shared/storage.js';
import { formatClock, parseHttpUrl } from '../shared/utils.js';
import { setupHabitBox } from './habit.js';
import { setupNoteBox } from './note.js';

const params = new URLSearchParams(window.location.search);
const target = parseHttpUrl(params.get('target'));
const allowanceHost = (params.get('site') || target?.hostname || '').toLowerCase();
const durationMinutes = readDuration(params.get('duration'));
const timer = document.querySelector('#timer');
const decision = document.querySelector('#decision');
const continueButton = document.querySelector('#continue');
const leaveButton = document.querySelector('#leave');
const tools = document.querySelector('#tools');
const noteButton = document.querySelector('#note-button');
const noteBox = document.querySelector('#note-box');
const noteCountdown = document.querySelector('#note-countdown');
const noteText = document.querySelector('#note-text');
const saveNote = document.querySelector('#save-note');
const habitButton = document.querySelector('#habit-button');
const skipButton = document.querySelector('#skip-button');
const habitBox = document.querySelector('#habit-box');
const habitForm = document.querySelector('#habit-form');
const habitSelect = document.querySelector('#habit-select');
const habitFields = document.querySelector('#habit-fields');
const habitTitle = document.querySelector('#habit-title');
const habitTrigger = document.querySelector('#habit-trigger');
const habitAction = document.querySelector('#habit-action');
const habitReward = document.querySelector('#habit-reward');
const habitCounterPlan = document.querySelector('#habit-counter');
const habitCounterUsed = document.querySelector('#habit-counter-used');
const cancelHabit = document.querySelector('#cancel-habit');

const durationSeconds = durationMinutes * 60;
const startedAt = Date.now();
const deadline = startedAt + durationSeconds * 1000;
let finished = false;
let intervalId;
let skipRule = 'none';
let habitLogged = false;
let secondsRecorded = false;

continueButton.disabled = target === null;

if (target && params.get('notes') === '1') {
  tools.hidden = false;
  noteButton.hidden = false;
  setupNoteBox({
    site: target.hostname,
    button: noteButton,
    box: noteBox,
    countdown: noteCountdown,
    textarea: noteText,
    saveButton: saveNote,
  });
}

if (target && params.get('habits') === '1') {
  tools.hidden = false;
  habitButton.hidden = false;
  setupHabitBox({
    site: target.hostname,
    button: habitButton,
    box: habitBox,
    form: habitForm,
    select: habitSelect,
    fields: habitFields,
    title: habitTitle,
    trigger: habitTrigger,
    action: habitAction,
    reward: habitReward,
    counterPlan: habitCounterPlan,
    counterUsed: habitCounterUsed,
    cancelButton: cancelHabit,
    onHabitSaved: markHabitLogged,
  });
}

getSettings().then((settings) => {
  skipRule = settings.skipRule;
  renderSkip();
}).catch((error) => {
  console.error('Blank Wall settings load failed:', error);
});

skipButton.addEventListener('click', () => {
  skipWall().catch((error) => {
    console.error('Blank Wall skip failed:', error);
  });
});

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
  timer.textContent = formatClock(remaining);

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

  await recordElapsedOnce();
}

async function skipWall() {
  if (!target || skipRule !== 'after-habit' || !habitLogged) {
    return;
  }

  await recordElapsedOnce();
  await recordSkip();

  const settings = await getSettings();
  await grantAllowance(allowanceHost, settings.allowanceMinutes);
  window.location.assign(target.href);
}

function markHabitLogged() {
  habitLogged = true;
  renderSkip();
}

function renderSkip() {
  skipButton.hidden = !(target && skipRule === 'after-habit' && habitLogged);
}

async function recordElapsedOnce() {
  if (secondsRecorded) {
    return;
  }

  secondsRecorded = true;
  const elapsed = Math.min(durationSeconds, Math.floor((Date.now() - startedAt) / 1000));
  await recordWallSeconds(elapsed);
}
