import { addHabit, addOccurrence, getHabits } from '../shared/storage.js';

export function setupHabitBox({
  site,
  button,
  box,
  form,
  select,
  fields,
  title,
  trigger,
  response,
  reward,
  counterPlan,
  counterUsed,
  cancelButton,
  onHabitSaved,
}) {
  const detailInputs = [title, trigger, response, reward, counterPlan];
  let open = false;

  button.addEventListener('click', () => {
    openHabitBox().catch((error) => {
      console.error('Blank Wall habit open failed:', error);
      closeHabitBox();
    });
  });

  select.addEventListener('change', toggleFields);
  cancelButton.addEventListener('click', closeHabitBox);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveHabit().catch((error) => {
      console.error('Blank Wall habit save failed:', error);
    });
  });

  async function openHabitBox() {
    if (open) {
      return;
    }

    open = true;
    button.disabled = true;
    form.reset();
    await populateHabits();
    toggleFields();
    box.hidden = false;
    select.focus();
  }

  async function populateHabits() {
    select.replaceChildren();

    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = 'New habit';
    select.append(newOption);

    for (const habit of await getHabits()) {
      const option = document.createElement('option');
      option.value = habit.id;
      option.textContent = `#${habit.id} ${habit.title}`;
      select.append(option);
    }
  }

  function toggleFields() {
    const isNew = select.value === 'new';
    fields.hidden = !isNew;

    for (const input of detailInputs) {
      input.disabled = !isNew;
    }
  }

  async function saveHabit() {
    const occurrence = { site, counterUsed: counterUsed.checked };

    if (select.value === 'new') {
      await addHabit({
        title: title.value.trim(),
        trigger: trigger.value.trim(),
        response: response.value.trim(),
        reward: reward.value.trim(),
        counterPlan: counterPlan.value.trim(),
      }, occurrence);
    } else {
      await addOccurrence(select.value, occurrence);
    }

    if (onHabitSaved) {
      onHabitSaved();
    }
    closeHabitBox();
  }

  function closeHabitBox() {
    if (!open) {
      return;
    }

    open = false;
    box.hidden = true;
    button.disabled = false;
  }
}
