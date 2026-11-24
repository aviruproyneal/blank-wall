# Blank Wall

Blank Wall is a de-stimulation tool for the browser. When you open a site you have blocked, you get a blank dark wall and a short pause instead of the site itself. While you wait you can write a note or record a habit pattern (Trigger, Action, Reward, counter-plan). Over time this builds a private map of the habits you want to change.

This repository is a monorepo for the prototype. The Chrome extension lives in [`extension/`](extension/); Android and desktop apps are out of scope for now but may be added later at the root.

## Status

The extension is built in small milestones so every change can be reviewed and committed on its own. Blocking and the basic wall are in place, using a temporary hard-coded `example.com` entry; the popup, dashboard, and note/habit tools come later.

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
5. Visit `http://example.com`. It should redirect to the wall and show a one-minute countdown.
6. After the countdown, use **Continue** to return to the site or **Leave** to open a blank tab. **Continue** grants a 15-minute allowance so the site is not blocked again immediately.
7. To test another site, edit `DEV_BLOCKED_SITES` in `extension/background.js` and reload the extension from `chrome://extensions`.

There is no build step and no dependency install: the extension is plain HTML, CSS, and vanilla JavaScript ES modules.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, code style, commit style, and pull request notes. Data-format decisions are recorded in [`docs/`](docs/) so other platforms can follow the same spec later.

## Privacy

All data stays on the user's device. The extension has no servers, analytics, accounts, or external network requests.

This project was built with AI assistance and reviewed and tested by the author.
