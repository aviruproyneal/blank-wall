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
