# Blank Wall

Blank Wall is a de-stimulation tool for the browser. When you open a site you have blocked, you get a blank dark wall and a short pause instead of the site itself. While you wait you can write a note or record a habit pattern (Trigger, Response, Reward, counter-plan). Over time this builds a private map of the habits you want to change.

This repository is a monorepo for the prototype. The Chrome extension lives in [`extension/`](extension/); Android and desktop apps are out of scope for now but may be added later at the root.

## Status

The extension is built in small milestones so every change can be reviewed and committed on its own. Blocking, the basic wall, the popup, dashboard site management, wall notes and habits, the dashboard Habits/Notes pages, settings with skip rules, backup folder setup, Markdown mirroring, and JSON export/import are in place. Existing data is migrated automatically on update. Until a site is added, a temporary hard-coded `example.com` entry is used for testing.

## Roadmap

1. Repository scaffolding
2. Extension skeleton: manifest, icons, shared theme and storage
3. Blocking and the basic wall
4. Popup
5. Dashboard shell and blocked sites
6. Notes on the wall
7. Habit tracking on the wall
8. Dashboard habits and notes pages
9. Settings and skip rules
10. Backup folder
11. Export and import
12. Docs and cleanup

## Run the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` directory.
4. Confirm that Blank Wall appears with no errors. Its service worker initializes local storage on install.
5. Click the toolbar icon. The popup shows the current hostname, today's stats, a backup status line, a **Block this site** button, and **Quick note** / **Log habit** / **Open dashboard** buttons.
6. Click **Block this site**; the label becomes **Unblock this site**. Reload that page to see the wall and its five-minute countdown. **Unblock this site** removes the block immediately.
7. On a blocked site, wait for the countdown to finish, then use **Continue** to return or **Leave** to open a blank tab. **Continue** grants the configured allowance so the site is not blocked again immediately.
8. Click **Open dashboard** in the popup. Manage sites there by hostname: change a site's wall duration, toggle notes and habits, or remove it. Changes apply to the next wall.
9. On a wall where notes are enabled, click the small note icon at bottom-left. The wall timer keeps counting while a separate one-minute note box is open. Save manually, or let the note timer end to save non-empty text automatically. Turning **Notes** off for a site in the dashboard hides the icon.
10. On a wall where habits are enabled, click the habit icon at bottom-left. Create a habit with a title, Trigger, Response, Reward, and counter-plan, or choose an existing `#001`-style habit to log another occurrence. Check **Counter plan used** when applicable; the wall timer keeps running.
11. In the dashboard sidebar, open **Habits**. Create a habit, then click its `#001`-style entry to see Trigger, Response, Reward, counter-plan, occurrence log, and counts. Log an occurrence from the detail view, edit the habit, and delete it.
12. In the dashboard sidebar, open **Notes**. Notes appear newest first with timestamp and source site. Search by text, site, or linked habit; add or edit a note and link it to a habit; delete notes you no longer need. **Quick note** in the popup opens this page.
13. In the dashboard sidebar, open **Settings** to change the default wall duration, temporary allowance length, and skip rule. **Skip** appears on the wall only with “Allow skip after a habit entry” selected and a habit entry written during that wall; it records a skip in today's stats.
14. On first install the dashboard opens with a welcome step. Click **Choose backup folder**, pick any local folder, and the Settings → Backup folder status should read **Connected** while the popup reads `Backup: connected`. To test the step again without reinstalling, open `chrome-extension://<extension-id>/dashboard/dashboard.html?welcome=1` in a tab. **Skip for now** closes the step and leaves a reminder in the dashboard and popup.
15. In Settings → Backup folder, use **Choose backup folder** to replace the folder, or **Reconnect backup folder** if Chrome reports `Needs reconnect` after a browser restart.
16. With a folder connected, add a note and a habit, then check the chosen folder: `BlankWall/notes/<today>.md` holds the day's notes, `BlankWall/habits/001-short-title.md` holds front matter and the occurrence log, and `BlankWall/blocked-sites.json` holds site settings. Editing or deleting an entry updates those files on the next change.
17. To test the pending queue, disconnect the folder's permission (or make it unavailable), add a note, then restore access and reopen the dashboard. The queued change is written when access returns; nothing is lost in between.
18. In Settings → Export and import, click **Export everything** to download a JSON snapshot of local storage. Click **Import from backup folder** to replace notes, habits, and blocked sites from the connected `BlankWall/` folder, then confirm the prompt and wait for the page to reload.
19. Until a site is added from the popup, `http://example.com` is blocked through the temporary `DEV_BLOCKED_SITES` fallback with a one-minute countdown. Once any site is stored, that fallback is ignored; edit `DEV_BLOCKED_SITES` and reload the extension to test another host.

There is no build step and no dependency install: the extension is plain HTML, CSS, and vanilla JavaScript ES modules.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, code style, commit style, and pull request notes. Data-format decisions are recorded in [`docs/`](docs/) so other platforms can follow the same spec later.

## Privacy

All data stays on the user's device. The extension has no servers, analytics, accounts, or external network requests.

This project was built with AI assistance and reviewed and tested by the author.
