import { addNote } from '../shared/storage.js';
import { formatClock } from '../shared/utils.js';

const NOTE_DURATION_SECONDS = 60;

export function setupNoteBox({ site, button, box, countdown, textarea, cancelButton, saveButton }) {
  let deadline = 0;
  let intervalId;
  let open = false;

  button.addEventListener('click', openNoteBox);

  textarea.addEventListener('input', () => {
    saveButton.disabled = textarea.value.trim().length === 0;
  });

  cancelButton.addEventListener('click', () => {
    closeNoteBox().catch((error) => {
      console.error('Blank Wall note close failed:', error);
    });
  });

  saveButton.addEventListener('click', () => {
    closeNoteBox(true).catch((error) => {
      console.error('Blank Wall note close failed:', error);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      closeNoteBox().catch((error) => {
        console.error('Blank Wall note close failed:', error);
      });
    }
  });

  function openNoteBox() {
    if (open) {
      return;
    }

    open = true;
    deadline = Date.now() + NOTE_DURATION_SECONDS * 1000;
    textarea.value = '';
    saveButton.disabled = true;
    button.disabled = true;
    box.hidden = false;
    textarea.focus();

    renderCountdown();
    intervalId = window.setInterval(renderCountdown, 250);
  }

  function renderCountdown() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    countdown.textContent = formatClock(remaining);

    if (remaining === 0) {
      closeNoteBox().catch((error) => {
        console.error('Blank Wall note close failed:', error);
      });
    }
  }

  async function closeNoteBox(save = false) {
    if (!open) {
      return;
    }

    open = false;
    window.clearInterval(intervalId);

    const text = textarea.value.trim();
    if (save && text) {
      try {
        await addNote(text, site);
      } catch (error) {
        console.error('Blank Wall note save failed:', error);
      }
    }

    box.hidden = true;
    button.disabled = false;
    textarea.value = '';
  }
}
