# Blank Wall browser extension

A Manifest V3 browser extension that replaces a blocked site with a quiet countdown and a chance to write a note or record a habit pattern. All data stays on the device.

## Install

Blank Wall is not published in an extension store. Download the ZIP from GitHub Releases or the repository, extract it, and load the `extension/` directory — the folder containing `manifest.json` — as an unpacked extension. Firefox needs the documented `manifest.firefox.json` copy step instead; that file carries Firefox's event-page declaration and add-on ID, while `manifest.json` has no browser-specific keys. There is no build step or dependency install. Full per-browser steps are in [`docs/installation.md`](../docs/installation.md).

| Browser | Status |
| --- | --- |
| Chrome | Supported; main test browser (121+). |
| Edge | Expected to work; not runtime tested here. |
| Brave | Expected to work; not runtime tested here. |
| Opera | Expected to work; not runtime tested here. |
| Vivaldi | Expected to work; not runtime tested here. |
| Firefox | Best-effort temporary load with `manifest.firefox.json`; folder backup unavailable; not runtime tested here. |
| Safari | Out of scope. |

Mobile browsers are out of scope.

On first install, the dashboard opens with a short welcome step. Where the File System Access API is available, it offers a backup folder; otherwise it explains how to use export and JSON import instead.

## Surfaces

- **Popup:** current hostname, block/unblock, today's stats, backup status, and links to the dashboard.
- **Dashboard:** blocked sites with per-site duration, reminder note, counter site, continue/allowance settings, and note/habit toggles; habits with Trigger/Response/Reward/Counter-plan details and occurrence logs; searchable notes; settings; backup folder controls; export; and import.
- **Wall:** a countdown shown instead of a blocked site. It reads the saved site settings when it opens. Notes and habits can be opened while it runs, and an optional skip appears after a habit entry.
- **Guide:** a short explanation linked from the popup, dashboard sidebar, and first-run welcome step.

See the [root README](../README.md) for a feature-by-feature test walkthrough.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `storage` | Persists blocked sites, notes, habits, settings, statistics, and allowances. |
| `unlimitedStorage` | Lets the note and habit history grow without hitting the small default storage quota. |
| `tabs` | Creates the dashboard tab on install and from the popup, and redirects a tab to the wall. |
| `webNavigation` | Detects navigation to a blocked hostname so it can be redirected before the site loads. |

No host permissions, accounts, analytics, or network access are requested. Where available, the File System Access API is called from the dashboard after a button click; it does not need a manifest permission. The directory handle and queued changes are kept in IndexedDB, not in a remote service.

## Backup folder

Where the File System Access API is available, the chosen folder receives a Markdown copy under `BlankWall/` whenever notes, habits, or blocked sites change. If folder access is unavailable, changes are queued in IndexedDB and written when access returns. Chromium can lapse the folder permission after a restart; in that case the dashboard and popup show `Needs reconnect` and a **Reconnect backup folder** button appears in Settings. Browsers without the API hide the folder controls; use export and JSON import there.

**Export everything** downloads a JSON snapshot of all local storage. **Import from backup folder** rebuilds notes, habits, and blocked sites from the Markdown files after a reinstall; **Import JSON file** does the same from a downloaded snapshot and works in every supported browser. Both paths accept older data that used `action:` instead of `response:`. Browser storage remains the source of truth; the folder is a safety copy and import source. The exact file formats are documented in [`docs/data-format.md`](../docs/data-format.md).

## Privacy

Everything is local. The extension makes no network requests, has no servers, and does not collect usage data.
