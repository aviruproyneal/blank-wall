# Blank Wall

Blank Wall is a de-stimulation tool for the browser. When you open a site you have blocked, you get a blank dark wall and a short pause instead of the site itself. While you wait you can write a note or record a habit pattern (Trigger, Action, Reward, counter-plan). Over time this builds a private map of the habits you want to change.

This repository is a monorepo for the prototype. The Chrome extension lives in [`extension/`](extension/); Android and desktop apps are out of scope for now but may be added later at the root.

## Status

The extension is built in small milestones so every change can be reviewed and committed on its own. The current milestone adds the repository scaffolding only; the loadable extension starts in milestone 2.

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

Once the extension files are present:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` directory.
4. Open the popup from the toolbar to check the current state.

There is no build step and no dependency install: the extension is plain HTML, CSS, and vanilla JavaScript ES modules.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, code style, commit style, and pull request notes. Data-format decisions are recorded in [`docs/`](docs/) so other platforms can follow the same spec later.

## Privacy

All data stays on the user's device. The extension has no servers, analytics, accounts, or external network requests.

This project was built with AI assistance and reviewed and tested by the author.
