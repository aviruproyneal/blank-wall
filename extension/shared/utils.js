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

export function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
