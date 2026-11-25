import {
  addHabit,
  addOccurrence,
  deleteHabit,
  getHabits,
  updateHabit,
} from '../shared/storage.js';
import { formatTimestamp } from '../shared/utils.js';

export function setupHabitsPage() {
  const listView = document.querySelector('#habit-list-view');
  const list = document.querySelector('#habit-list');
  const empty = document.querySelector('#empty-habits');
  const newButton = document.querySelector('#new-habit');
  const editor = document.querySelector('#habit-editor');
  const editorTitle = document.querySelector('#habit-editor-title');
  const cancelEditor = document.querySelector('#cancel-habit-editor');
  const detail = document.querySelector('#habit-detail');
  const detailTitle = document.querySelector('#habit-detail-title');
  const detailFields = document.querySelector('#habit-detail-fields');
  const occurrenceCount = document.querySelector('#habit-occurrences');
  const counterCount = document.querySelector('#habit-counter-used-count');
  const occurrenceForm = document.querySelector('#add-occurrence');
  const occurrenceSite = document.querySelector('#occurrence-site');
  const occurrenceCounterUsed = document.querySelector('#occurrence-counter-used');
  const occurrenceList = document.querySelector('#occurrence-list');
  const backButton = document.querySelector('#back-to-habits');
  const editButton = document.querySelector('#edit-habit');
  const deleteButton = document.querySelector('#delete-habit');
  const fields = {
    title: document.querySelector('#habit-title'),
    trigger: document.querySelector('#habit-trigger'),
    response: document.querySelector('#habit-response'),
    reward: document.querySelector('#habit-reward'),
    counterPlan: document.querySelector('#habit-counter'),
  };

  let editingId = null;
  let currentId = null;

  newButton.addEventListener('click', () => {
    openEditor().catch(logError('open habit editor'));
  });

  cancelEditor.addEventListener('click', showList);

  editor.addEventListener('submit', (event) => {
    event.preventDefault();
    saveEditor().catch(logError('save habit'));
  });

  backButton.addEventListener('click', showList);

  editButton.addEventListener('click', () => {
    openEditor(currentId).catch(logError('open habit editor'));
  });

  deleteButton.addEventListener('click', () => {
    removeHabit().catch(logError('delete habit'));
  });

  occurrenceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    logOccurrence().catch(logError('log occurrence'));
  });

  refreshList().catch(logError('load habits'));

  async function refreshList() {
    const habits = await getHabits();
    list.replaceChildren();
    empty.hidden = habits.length > 0;

    for (const habit of habits) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `#${habit.id} ${habit.title}`;
      button.addEventListener('click', () => {
        openDetail(habit.id).catch(logError('open habit'));
      });
      item.append(button);
      list.append(item);
    }
  }

  async function openEditor(id = null) {
    editingId = id;
    editorTitle.textContent = id ? `Edit #${id}` : 'New habit';

    for (const input of Object.values(fields)) {
      input.value = '';
    }

    if (id) {
      const habit = (await getHabits()).find((candidate) => candidate.id === id);
      if (!habit) {
        showList();
        return;
      }

      for (const [key, input] of Object.entries(fields)) {
        input.value = habit[key] ?? '';
      }
    }

    listView.hidden = true;
    detail.hidden = true;
    editor.hidden = false;
    fields.title.focus();
  }

  async function saveEditor() {
    const details = Object.fromEntries(
      Object.entries(fields).map(([key, input]) => [key, input.value.trim()]),
    );

    let id;
    if (editingId) {
      await updateHabit(editingId, details);
      id = editingId;
    } else {
      id = (await addHabit(details)).id;
    }

    await refreshList();
    await openDetail(id);
  }

  async function openDetail(id) {
    const habit = (await getHabits()).find((candidate) => candidate.id === id);
    if (!habit) {
      showList();
      return;
    }

    currentId = id;
    detailTitle.textContent = `#${habit.id} ${habit.title}`;
    detailFields.replaceChildren();

    for (const [label, value] of [
      ['Trigger', habit.trigger],
      ['Response', habit.response],
      ['Reward', habit.reward],
      ['Counter-plan', habit.counterPlan],
    ]) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value || '—';
      row.append(term, description);
      detailFields.append(row);
    }

    occurrenceCount.textContent = String(habit.occurrences.length);
    counterCount.textContent = String(habit.occurrences.filter((entry) => entry.counterUsed).length);

    occurrenceList.replaceChildren();
    for (const occurrence of [...habit.occurrences].reverse()) {
      const item = document.createElement('li');
      const site = occurrence.site ? `, ${occurrence.site}` : '';
      const counter = occurrence.counterUsed ? ', counter used' : '';
      item.textContent = `${formatTimestamp(occurrence.timestamp)}${site}${counter}`;
      occurrenceList.append(item);
    }

    listView.hidden = true;
    editor.hidden = true;
    detail.hidden = false;
  }

  async function logOccurrence() {
    if (!currentId) {
      return;
    }

    await addOccurrence(currentId, {
      site: occurrenceSite.value.trim(),
      counterUsed: occurrenceCounterUsed.checked,
    });
    occurrenceSite.value = '';
    occurrenceCounterUsed.checked = false;
    await openDetail(currentId);
  }

  async function removeHabit() {
    if (!currentId || !window.confirm('Delete this habit and its occurrences?')) {
      return;
    }

    await deleteHabit(currentId);
    await refreshList();
    showList();
  }

  function showList() {
    editingId = null;
    currentId = null;
    listView.hidden = false;
    editor.hidden = true;
    detail.hidden = true;
  }
}

function logError(context) {
  return (error) => {
    console.error(`Blank Wall ${context} failed:`, error);
  };
}
