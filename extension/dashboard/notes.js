import {
  addNote,
  deleteNote,
  getHabits,
  getNotes,
  updateNote,
} from '../shared/storage.js';
import { formatTimestamp } from '../shared/utils.js';

export function setupNotesPage() {
  const listView = document.querySelector('#notes-list-view');
  const searchInput = document.querySelector('#note-search');
  const newButton = document.querySelector('#new-note');
  const empty = document.querySelector('#empty-notes');
  const noResults = document.querySelector('#no-note-results');
  const list = document.querySelector('#note-list');
  const editor = document.querySelector('#note-editor');
  const editorTitle = document.querySelector('#note-editor-title');
  const textInput = document.querySelector('#note-editor-text');
  const siteInput = document.querySelector('#note-editor-site');
  const habitSelect = document.querySelector('#note-editor-habit');
  const cancelEditor = document.querySelector('#cancel-note-editor');

  let editingId = null;
  let notes = [];
  let habits = [];

  searchInput.addEventListener('input', renderList);

  newButton.addEventListener('click', () => {
    openEditor().catch(logError('open note editor'));
  });

  cancelEditor.addEventListener('click', showList);

  editor.addEventListener('submit', (event) => {
    event.preventDefault();
    saveEditor().catch(logError('save note'));
  });

  refresh().catch(logError('load notes'));

  async function refresh() {
    [notes, habits] = await Promise.all([getNotes(), getHabits()]);
    renderList();
  }

  function renderList() {
    const query = searchInput.value.trim().toLowerCase();
    const habitTitles = new Map(habits.map((habit) => [habit.id, habit.title]));
    const visible = notes
      .filter((note) => {
        if (!query) {
          return true;
        }
        const searchable = [note.text, note.site || '', habitTitles.get(note.habitId) || ''];
        return searchable.join(' ').toLowerCase().includes(query);
      })
      .sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp));

    list.replaceChildren();
    empty.hidden = notes.length > 0;
    noResults.hidden = notes.length === 0 || visible.length > 0;

    for (const note of visible) {
      list.append(createNoteElement(note, habitTitles));
    }
  }

  function createNoteElement(note, habitTitles) {
    const item = document.createElement('li');
    item.className = 'note';

    const meta = document.createElement('div');
    meta.className = 'note__meta';
    const parts = [formatTimestamp(note.timestamp), note.site || 'Wall'];
    if (note.habitId && habitTitles.has(note.habitId)) {
      parts.push(`#${note.habitId} ${habitTitles.get(note.habitId)}`);
    }
    meta.textContent = parts.join(' · ');

    const text = document.createElement('p');
    text.className = 'note__text';
    text.textContent = note.text;

    const actions = document.createElement('div');
    actions.className = 'note__actions';

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      openEditor(note).catch(logError('open note editor'));
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => {
      removeNote(note).catch(logError('delete note'));
    });

    actions.append(edit, remove);
    item.append(meta, text, actions);
    return item;
  }

  function openEditor(note = null) {
    editingId = note?.id ?? null;
    editorTitle.textContent = note ? 'Edit note' : 'New note';
    textInput.value = note?.text ?? '';
    siteInput.value = note?.site ?? '';
    populateHabitSelect(note?.habitId ?? null);
    listView.hidden = true;
    editor.hidden = false;
    textInput.focus();
  }

  function populateHabitSelect(selectedId) {
    habitSelect.replaceChildren();

    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No habit';
    habitSelect.append(none);

    for (const habit of habits) {
      const option = document.createElement('option');
      option.value = habit.id;
      option.textContent = `#${habit.id} ${habit.title}`;
      habitSelect.append(option);
    }

    habitSelect.value = selectedId || '';
  }

  async function saveEditor() {
    const text = textInput.value.trim();
    if (!text) {
      return;
    }

    const site = siteInput.value.trim();
    const habitId = habitSelect.value || null;

    if (editingId) {
      await updateNote(editingId, { text, site, habitId });
    } else {
      await addNote(text, site, habitId);
    }

    await refresh();
    showList();
  }

  async function removeNote(note) {
    if (!window.confirm('Delete this note?')) {
      return;
    }

    await deleteNote(note.id);
    await refresh();
  }

  function showList() {
    editingId = null;
    listView.hidden = false;
    editor.hidden = true;
  }
}

function logError(context) {
  return (error) => {
    console.error(`Blank Wall ${context} failed:`, error);
  };
}
