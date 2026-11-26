const SVG_NS = 'http://www.w3.org/2000/svg';
const TOAST_TONES = ['info', 'success', 'danger'];
const FALLBACK_TOAST_DURATION = 4000;

let dialog;
let dialogParts;
let toastHost;
let confirmQueue = Promise.resolve();

export function icon(name, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const use = document.createElementNS(SVG_NS, 'use');

  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', `../shared/icons.svg#icon-${name}`);
  svg.append(use);
  return svg;
}

export function askConfirm(options) {
  const result = confirmQueue.then(() => presentConfirm(options));
  confirmQueue = result.catch(() => {});
  return result;
}

export function showToast(message, tone = 'info') {
  const host = toastHost ?? createToastHost();
  const toast = document.createElement('div');

  toast.className = `toast toast--${TOAST_TONES.includes(tone) ? tone : 'info'}`;
  toast.textContent = message;
  host.append(toast);

  const token = getComputedStyle(document.documentElement).getPropertyValue('--toast-duration');
  const duration = Number.parseFloat(token);
  window.setTimeout(
    () => toast.remove(),
    Number.isFinite(duration) ? duration : FALLBACK_TOAST_DURATION,
  );
}

function presentConfirm(options) {
  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = options;
  const parts = dialogParts ?? createDialog();

  parts.title.textContent = title;
  parts.message.textContent = message;
  parts.cancel.textContent = cancelLabel;
  parts.accept.textContent = confirmLabel;
  parts.accept.classList.toggle('button--primary', !danger);
  parts.accept.classList.toggle('button--danger', danger);

  return new Promise((resolve) => {
    let settled = false;

    function finish(result) {
      if (settled) {
        return;
      }
      settled = true;
      parts.accept.removeEventListener('click', accept);
      parts.cancel.removeEventListener('click', cancel);
      dialog.removeEventListener('close', closed);
      if (dialog.open) {
        dialog.close();
      }
      resolve(result);
    }

    function accept() {
      finish(true);
    }

    function cancel() {
      finish(false);
    }

    function closed() {
      finish(false);
    }

    parts.accept.addEventListener('click', accept);
    parts.cancel.addEventListener('click', cancel);
    dialog.addEventListener('close', closed);
    dialog.showModal();
    (danger ? parts.cancel : parts.accept).focus();
  });
}

function createDialog() {
  dialog = document.createElement('dialog');
  dialog.className = 'dialog';

  const body = document.createElement('div');
  body.className = 'dialog__body';

  const title = document.createElement('h2');
  title.className = 'dialog__title';
  title.id = 'dialog-title';

  const message = document.createElement('p');
  message.className = 'dialog__message';
  message.id = 'dialog-message';

  body.append(title, message);

  const footer = document.createElement('div');
  footer.className = 'dialog__footer';

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'button button--secondary';

  const accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'button button--primary';

  footer.append(cancel, accept);
  dialog.append(body, footer);
  dialog.setAttribute('aria-labelledby', title.id);
  dialog.setAttribute('aria-describedby', message.id);
  document.body.append(dialog);

  dialogParts = { title, message, cancel, accept };
  return dialogParts;
}

function createToastHost() {
  toastHost = document.createElement('div');
  toastHost.className = 'toast-host';
  toastHost.setAttribute('role', 'status');
  toastHost.setAttribute('aria-live', 'polite');
  document.body.append(toastHost);
  return toastHost;
}
