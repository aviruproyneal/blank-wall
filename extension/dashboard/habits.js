import {
  addHabit,
  deleteHabit,
  getHabits,
  updateHabit,
} from '../shared/storage.js';
import { formatHabitNumber, formatOccurrenceDate } from '../shared/utils.js';
import { askConfirm } from '../shared/ui.js';

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

  refreshList().catch(logError('load habits'));

  async function refreshList() {
    const habits = await getHabits();
    list.replaceChildren();
    empty.hidden = habits.length > 0;

    for (const habit of habits) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';

      const number = document.createElement('span');
      number.className = 'habit-list__number';
      number.textContent = `${formatHabitNumber(habit.id)}.`;
      const title = document.createElement('span');
      title.textContent = habit.title;
      button.append(number, title);

      button.addEventListener('click', () => {
        openDetail(habit.id).catch(logError('open habit'));
      });
      item.append(button);
      list.append(item);
    }
  }

  async function openEditor(id = null) {
    editingId = id;
    editorTitle.textContent = id ? `Edit ${formatHabitNumber(id)}` : 'New habit';

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
    detailTitle.replaceChildren();
    const number = document.createElement('span');
    number.className = 'habit-detail__number';
    number.textContent = `${formatHabitNumber(habit.id)}.`;
    const title = document.createElement('span');
    title.textContent = habit.title;
    detailTitle.append(number, title);
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
      const source = occurrence.site ? ` · ${occurrence.site}` : '';
      const stamp = document.createElement('span');
      stamp.textContent = `${formatOccurrenceDate(occurrence.timestamp)}${source}`;
      item.append(stamp);

      if (occurrence.counterUsed) {
        const counter = document.createElement('span');
        counter.className = 'occurrence__counter';
        counter.textContent = 'Counter-plan used';
        item.append(counter);
      }

      occurrenceList.append(item);
    }

    listView.hidden = true;
    editor.hidden = true;
    detail.hidden = false;
  }

  async function removeHabit() {
    if (!currentId) {
      return;
    }

    const confirmed = await askConfirm({
      title: 'Delete habit?',
      message: 'Delete this habit and its occurrences? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) {
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
