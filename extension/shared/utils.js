export function parseHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function normalizeHostname(value) {
  const raw = value.trim().toLowerCase();
  const url = parseHttpUrl(raw) ?? parseHttpUrl(`https://${raw}`);

  if (!url) {
    return null;
  }

  return url.hostname.replace(/^\.+|\.+$/g, '') || null;
}

export function findBlockedSite(hostname, sites) {
  if (typeof hostname !== 'string') {
    return null;
  }

  const host = hostname.toLowerCase();
  return sites.find((site) => {
    const blocked = typeof site?.hostname === 'string' ? site.hostname.toLowerCase() : '';
    return Boolean(blocked) && (host === blocked || host.endsWith(`.${blocked}`));
  }) ?? null;
}

export function parseCounterSite(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return { url: '', hostname: '' };
  }
  const url = parseCounterUrl(raw);
  if (!url) {
    return { error: 'Enter a valid website address.' };
  }
  return { url: url.href, hostname: url.hostname.toLowerCase() };
}

export function normalizeCounterSite(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const url = raw ? parseCounterUrl(raw) : null;
  return url ? url.href : '';
}

function parseCounterUrl(raw) {
  // Bare input is assumed to be https, so reject other explicit schemes first.
  return parseHttpUrl(raw)
    ?? (hasExplicitScheme(raw) ? null : parseHttpUrl(`https://${raw}`));
}

function hasExplicitScheme(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

export function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const OCCURRENCE_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const OCCURRENCE_TIME = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatOccurrenceDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${OCCURRENCE_DATE.format(date)}, ${OCCURRENCE_TIME.format(date)}`;
}

export function formatHabitNumber(id) {
  const number = Number(id);
  return Number.isInteger(number) && number > 0 ? String(number) : String(id);
}
