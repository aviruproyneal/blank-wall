# Contributing

## Setup

Clone the repository and load `extension/` as an unpacked extension in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select `extension/`.
4. Reload the extension after changing files.

No build step, package manager, or external dependency is required. Pages use plain HTML, CSS, and vanilla JavaScript ES modules. Icons are simple local files and icons in the UI are inline SVG.

## Making a change

- Keep each change to one small feature or fix that can be reviewed in a few minutes.
- Test the change in Chrome after reloading the extension. If it affects storage or navigation, check both a fresh install and an existing profile.
- Update the relevant docs when the data model or behavior changes.
- Keep all data local; do not add analytics, accounts, or network requests.

## Code style

- 2-space indentation, semicolons, and single quotes.
- Short, descriptive names and small focused functions.
- Comments only for non-obvious constraints, browser quirks, or why a decision was made.
- CSS colors and spacing come from `extension/shared/theme.css`.
- No dead code, placeholders, or unrelated reformatting.

## Commit messages

Use Conventional Commits with a short imperative subject:

- `feat: add wall countdown timer`
- `fix: pause wall timer while note box is open`
- `docs: add data format spec`
- `chore: add repository scaffolding`

Pull requests should describe what changed, how to test it in Chrome, and any decisions that are not obvious from the diff.
