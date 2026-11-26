import { callChromeApi } from '../shared/api.js';
import {
  getSettings,
  getWallSiteSettings,
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
const sessionKey = `blank-wall:${allowanceHost}:${target?.href ?? ''}`;
const session = readSession(sessionKey);
const fallbackSiteSettings = {
  durationMinutes: 5,
  allowContinue: true,
  counterSite: '',
  note: '',
  allowanceMinutes: 15,
  notesEnabled: true,
  habitsEnabled: true,
};
const siteSettings = await getWallSiteSettings(allowanceHost).catch((error) => {
  console.error('Blank Wall site settings load failed:', error);
  return fallbackSiteSettings;
});
const durationMinutes = readMinutes(siteSettings.durationMinutes, 5);
const allowanceMinutes = readMinutes(siteSettings.allowanceMinutes, 15);
const allowContinue = siteSettings.allowContinue !== false;
const counterSite = parseHttpUrl(siteSettings.counterSite);
const reminderNote = String(siteSettings.note ?? '').trim().slice(0, 200);
const timer = document.querySelector('#timer');
const note = document.querySelector('#note');
const decision = document.querySelector('#decision');
const continueButton = document.querySelector('#continue');
const counterButton = document.querySelector('#counter-site');
const leaveButton = document.querySelector('#leave');
const tools = document.querySelector('#tools');
const noteButton = document.querySelector('#note-button');
const noteBox = document.querySelector('#note-box');
const noteCountdown = document.querySelector('#note-countdown');
const noteText = document.querySelector('#note-text');
const cancelNote = document.querySelector('#cancel-note');
const saveNote = document.querySelector('#save-note');
const habitButton = document.querySelector('#habit-button');
const skipButton = document.querySelector('#skip-button');
const habitBox = document.querySelector('#habit-box');
const habitForm = document.querySelector('#habit-form');
const habitSelect = document.querySelector('#habit-select');
const habitFields = document.querySelector('#habit-fields');
const habitTitle = document.querySelector('#habit-title');
const habitTrigger = document.querySelector('#habit-trigger');
const habitResponse = document.querySelector('#habit-response');
const habitReward = document.querySelector('#habit-reward');
const habitCounterPlan = document.querySelector('#habit-counter');
const habitCounterPlanText = document.querySelector('#habit-counter-plan-text');
const habitCounterUsed = document.querySelector('#habit-counter-used');
const habitCounterUsedLabel = document.querySelector('#habit-counter-used-label');
const cancelHabit = document.querySelector('#cancel-habit');

const durationSeconds = durationMinutes * 60;
const now = Date.now();
const savedStart = Number(session?.startedAt);
const startedAt = Number.isFinite(savedStart) && savedStart <= now ? savedStart : now;
const savedDeadline = Number(session?.deadline);
const deadline = Number.isFinite(savedDeadline) && savedDeadline > startedAt
  ? savedDeadline
  : startedAt + durationSeconds * 1000;
let startRecorded = session?.startRecorded === true;
let finished = false;
let intervalId;
let skipRule = 'none';
let habitLogged = false;
let secondsRecorded = session?.secondsRecorded === true;

writeSession();

if (reminderNote) {
  note.textContent = reminderNote;
  note.hidden = false;
}

continueButton.hidden = !(target && allowContinue);
counterButton.hidden = counterSite === null;

if (target && siteSettings.notesEnabled) {
  tools.hidden = false;
  noteButton.hidden = false;
  setupNoteBox({
    site: target.hostname,
    button: noteButton,
    box: noteBox,
    countdown: noteCountdown,
    textarea: noteText,
    cancelButton: cancelNote,
    saveButton: saveNote,
  });
}

if (target && siteSettings.habitsEnabled) {
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
    response: habitResponse,
    reward: habitReward,
    counterPlan: habitCounterPlan,
    counterPlanText: habitCounterPlanText,
    counterUsed: habitCounterUsed,
    counterUsedLabel: habitCounterUsedLabel,
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

if (!startRecorded) {
  recordWallStart().then(() => {
    startRecorded = true;
    writeSession();
  }).catch((error) => {
    console.error('Blank Wall wall statistics failed:', error);
  });
}

render();
intervalId = window.setInterval(render, 250);

continueButton.addEventListener('click', () => {
  continueToTarget().catch((error) => {
    console.error('Blank Wall continue failed:', error);
  });
});

counterButton.addEventListener('click', () => {
  if (counterSite) {
    clearSession();
    window.location.assign(counterSite.href);
  }
});

leaveButton.addEventListener('click', () => {
  clearSession();
  callChromeApi('runtime.sendMessage', { type: 'close-tab' }).catch((error) => {
    console.error('Blank Wall tab close failed:', error);
  });
});

async function continueToTarget() {
  if (!target || !allowContinue) {
    return;
  }

  await grantAllowance(allowanceHost, allowanceMinutes);
  clearSession();
  window.location.assign(target.href);
}

function readMinutes(raw, fallback) {
  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : fallback;
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
  if (!target || !allowContinue || skipRule !== 'after-habit' || !habitLogged) {
    return;
  }

  await recordElapsedOnce();
  await recordSkip();

  const settings = await getSettings();
  await grantAllowance(allowanceHost, allowanceMinutes);
  clearSession();
  window.location.assign(target.href);
}

function markHabitLogged() {
  habitLogged = true;
  renderSkip();
}

function renderSkip() {
  skipButton.hidden = !(target && allowContinue && skipRule === 'after-habit' && habitLogged);
}

async function recordElapsedOnce() {
  if (secondsRecorded) {
    return;
  }

  secondsRecorded = true;
  const elapsed = Math.min(durationSeconds, Math.floor((Date.now() - startedAt) / 1000));

  try {
    await recordWallSeconds(elapsed);
    writeSession();
  } catch (error) {
    secondsRecorded = false;
    throw error;
  }
}

function readSession(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession() {
  try {
    window.sessionStorage.setItem(sessionKey, JSON.stringify({
      startedAt,
      deadline,
      startRecorded,
      secondsRecorded,
    }));
  } catch {
    // Storage access can be blocked; this wall still runs from memory.
  }
}

function clearSession() {
  try {
    window.sessionStorage.removeItem(sessionKey);
  } catch {
    return;
  }
}
