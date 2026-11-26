# Install Blank Wall

Blank Wall is not published in any extension store yet. Download a ZIP from GitHub Releases (or from the repository), extract it, and load the `extension/` folder as an unpacked extension. There is no build step, dependency install, or network access.

Use a current desktop browser. Chromium browsers use `manifest.json`; Firefox uses `manifest.firefox.json` as described below. Chrome/Chromium 121 or newer and Firefox 121 or newer are the declared minimums.

## Get the code

1. Download the ZIP from GitHub Releases or the repository's **Code → Download ZIP**.
2. Extract the ZIP to a folder you will keep in place.
3. Open that folder and find `extension/`. The file `manifest.json` must be directly inside the folder you select. Do not select the repository root, the ZIP file, or a folder that only contains `extension/` nested inside it.

If you cloned the repository instead, select the repository's `extension/` folder.

## Browser support

| Browser | Status | Notes |
| --- | --- | --- |
| Chrome | Supported | Main development browser. Chrome 121 or newer is required. |
| Edge | Expected to work | Same Chromium MV3 build. Not runtime tested here. |
| Brave | Expected to work | Brave documents support for Chromium-compatible extensions. Not runtime tested here. |
| Opera | Expected to work | Same Chromium MV3 build. Not runtime tested here. |
| Vivaldi | Expected to work | Same Chromium MV3 build. Not runtime tested here. |
| Firefox | Best effort, temporary only | Uses `manifest.firefox.json`. Manifest and APIs were audited for Firefox 121+. Not runtime tested here. Folder backup is unavailable. |
| Safari | Out of scope | Not supported or tested. |

Mobile browsers are out of scope on every platform.

## Chromium browsers

Use the same unpacked `extension/` folder in Chrome, Edge, Brave, Opera, and Vivaldi.

| Browser | Extensions page |
| --- | --- |
| Chrome | `chrome://extensions` |
| Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |

1. Open the extensions page for your browser. In Brave you can also use **Menu → More Tools → Extensions**.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select the extracted `extension/` folder — the one that contains `manifest.json` directly.
5. Confirm that Blank Wall appears with no errors. Pin the toolbar icon if your browser offers that option.
6. Reload the extension from its extensions page after changing any source file. Manifest, background, and content changes are not picked up until you do.

## Firefox

Firefox uses an event page instead of a service worker for this Manifest V3 extension. Use `manifest.firefox.json` there; it differs from `manifest.json` only in the background declaration. Firefox needs version 121 or newer.

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **This Firefox**.
3. In a copy of the extracted folder, replace `manifest.json` with `manifest.firefox.json`. Keep the name `manifest.json` when you load it; no build step is involved.
4. Choose **Load Temporary Add-on**.
5. Select `extension/manifest.json` inside that copied folder. Firefox asks for a file here, not the whole folder.
6. Confirm that Blank Wall appears in the temporary extensions list.

A temporary add-on stays installed only until you remove it or restart Firefox. Reload it after every Firefox restart; browser storage may remain, but the extension itself is not installed permanently.

### Permanent installation

Release and beta Firefox do not install unsigned add-ons. A permanent install needs a Mozilla-signed build, either distributed through addons.mozilla.org (AMO) or self-distributed after signing through AMO. The manifest already includes the Firefox add-on ID `@blank-wall` needed for signing. New AMO submissions also need a `data_collection_permissions` declaration; this project collects no data, so the signed build would declare `none`.

Unsigned installs are limited to Firefox Developer Edition, Nightly, and ESR with `xpinstall.signatures.required` changed to `false` and an add-on ID present. That is a developer workflow, not an end-user installation method. This repository does not ship a signed build.

## Known limitations

| Area | Limitation |
| --- | --- |
| Folder backup | Automatic Markdown mirroring needs the File System Access API. Firefox does not provide it, so the folder controls are hidden and the popup reads `Backup: export only`. Use **Export everything** and **Import JSON file** there. |
| Firefox installation | Temporary add-ons disappear on restart. There is no signed build in this repository. |
| Manifest split | Chrome warns about `background.scripts` in Manifest V3, so Chromium uses `manifest.json` with `service_worker` only. Firefox uses `manifest.firefox.json` with `scripts` only. |
| Folder permission | Chromium can lapse folder access after a restart. The dashboard then shows `Needs reconnect` and offers **Reconnect backup folder**. |
| Runtime verification | Chrome was used for development checks. Edge, Brave, Opera, Vivaldi, and Firefox were checked against official documentation and code only; they have not been run here. |

## Troubleshooting

- **Chrome reports "'background.scripts' requires manifest version of 2 or lower":** you loaded the Firefox manifest in Chrome. Reload using the original `manifest.json`; do not use `manifest.firefox.json` in Chromium browsers.
- **The extension does not appear after loading it:** make sure **Developer mode** is on, then try **Load unpacked** again.
- **"Manifest file is missing or unreadable":** select `extension/`, the folder containing `manifest.json` directly. Unzip the archive first; browsers do not load a ZIP in place.
- **Nothing changes after editing files:** reload the extension from its extensions page. In Firefox, use **Reload** on the temporary add-on card.
- **The wall does not appear:** add the site from the popup or dashboard first, for example `example.com`, then reload that tab. With no sites stored, nothing is blocked.
- **Backup folder buttons are missing:** expected in Firefox and any other browser without `window.showDirectoryPicker`. Use **Export everything** and **Import JSON file** on the dashboard Settings page.
- **The Firefox add-on disappeared:** temporary add-ons are removed when Firefox restarts. Load it again with **Load Temporary Add-on**.

## Documentation sources

The steps above were checked against current official documentation:

- [Chrome: load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Edge: sideload an extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)
- [Edge: `edge://extensions` reference](https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/performance/edge-high-cpu-memory)
- [Brave: add extensions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave)
- [Opera: test and debug extensions](https://help.opera.com/en/extensions/testing/)
- [Vivaldi: extensions](https://help.vivaldi.com/desktop/extensions/extensions/)
- [MDN: `manifest.json` background key](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
- [MDN: `browser_specific_settings`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
- [MDN: differences between API implementations](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Differences_between_API_implementations)
- [MDN: `showDirectoryPicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
- [Firefox Extension Workshop: temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
- [Firefox Extension Workshop: signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
