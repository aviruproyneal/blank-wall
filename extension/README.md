# Blank Wall browser extension

A Manifest V3 Chrome extension that replaces a blocked site with a quiet countdown and a chance to write a note or record a habit pattern. All data stays on the device.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `extension/` directory.
4. Reload the extension after changing any file. There is no build step or dependency install.

On first install, the dashboard opens with a short welcome step for choosing a backup folder. It can be skipped and started later from Settings.

## Surfaces

- **Popup:** current hostname, block/unblock, today's stats, backup status, and links to the dashboard.
- **Dashboard:** blocked sites with per-site duration and note/habit toggles, habits with Trigger/Response/Reward/Counter-plan details and occurrence logs, searchable notes, settings, backup folder controls, export, and import.
- **Wall:** a countdown shown instead of a blocked site. Notes and habits can be opened while it runs, and an optional skip appears after a habit entry.
- **Guide:** a short explanation linked from the popup, dashboard sidebar, and first-run welcome step.

See the [root README](../README.md) for a feature-by-feature test walkthrough.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `storage` | Persists blocked sites, notes, habits, settings, statistics, and allowances. |
| `unlimitedStorage` | Lets the note and habit history grow without hitting the small default storage quota. |
| `tabs` | Creates the dashboard tab on install and from the popup, and redirects a tab to the wall. |
| `webNavigation` | Detects navigation to a blocked hostname so it can be redirected before the site loads. |

No host permissions, accounts, analytics, or network access are requested. The File System Access API is called from the dashboard after a button click; it does not need a manifest permission. The directory handle and queued changes are kept in IndexedDB, not in a remote service.

## Backup folder

The chosen folder receives a Markdown copy under `BlankWall/` whenever notes, habits, or blocked sites change. If folder access is unavailable, changes are queued in IndexedDB and written when access returns. Chrome can lapse the folder permission after a restart; in that case the dashboard and popup show `Needs reconnect` and a **Reconnect backup folder** button appears in Settings.

**Export everything** downloads a JSON snapshot of all local storage. **Import from backup folder** rebuilds notes, habits, and blocked sites from the Markdown files after a reinstall, including older files that used `action:` instead of `response:`. Browser storage remains the source of truth; the folder is a safety copy and import source. The exact file formats are documented in [`docs/data-format.md`](../docs/data-format.md).

## Privacy

Everything is local. The extension makes no network requests, has no servers, and does not collect usage data.
