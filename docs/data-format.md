# Data format

Blank Wall keeps browser storage as the source of truth. A folder chosen by the user is a Markdown safety copy and an import source. Nothing is sent to a server.

## Browser storage (`chrome.storage.local`)

| Key | Shape |
| --- | --- |
| `schemaVersion` | Number; current version is `3` |
| `blockedSites` | `[{ hostname, durationMinutes, notesEnabled, habitsEnabled, note, counterSite, allowContinue, allowanceMinutes }]` |
| `habits` | `[{ id, title, trigger, response, reward, counterPlan, occurrences: [{ timestamp, site, counterUsed }] }]` |
| `notes` | `[{ id, timestamp, site, text, habitId? }]` |
| `stats` | `{ 'YYYY-MM-DD': { walls, wallSeconds, skips } }` |
| `allowances` | `{ hostname: expiryTimestampMillis }` |
| `settings` | `{ defaultDurationMinutes, skipRule }` |
| `nextHabitNumber` | Number; the next serial habit ID |

Habit IDs are zero-padded serial numbers (`001`, `002`, ...). Deleted IDs are not reused. `timestamp` values are ISO 8601 strings. `skipRule` is `none` or `after-habit`. A blocked site covers its exact hostname and subdomains case-insensitively; the popup, background, and dashboard use that same rule. Allowances are keyed by the matched blocked hostname and cover its subdomains. A wall reload resumes its per-tab timer and does not add another wall or duplicate wall seconds.

Version `2` renamed the habit field `action` to `response`. Version `3` added per-site `note`, `counterSite`, `allowContinue`, and `allowanceMinutes`, and removed the global `settings.allowanceMinutes`. The migration runs on extension update and on first read, preserves existing values, and can be run repeatedly. For older sites, `allowContinue` becomes `true`, `note` and `counterSite` become empty strings, and `allowanceMinutes` comes from the old global setting (minimum 1, default 15). Older backups with `action:` front matter or sites without the new fields remain importable.

Per-site `note` is a short reminder (200 characters or fewer). `counterSite` is a normalized full `http:` or `https:` URL, empty when unset. `allowContinue` controls whether the wall offers a return to the blocked site, and `allowanceMinutes` is the temporary allowance granted when it does.

The background passes only `target` (the original URL) and `site` (the matched hostname) to the wall. The wall reads duration, reminder note, counter site, continue rule, allowance, and note/habit toggles from `blockedSites` when it opens. If that site can no longer be found, it uses the global default duration and the per-site defaults: no note or counter site, continuing allowed with a 15-minute allowance, and both wall tools shown.

## Backup state (IndexedDB)

Database `blank-wall-backup`, object store `state` (only used in browsers that provide the File System Access API):

| Key | Shape |
| --- | --- |
| `directoryHandle` | `FileSystemDirectoryHandle` chosen in the dashboard |
| `pendingChanges` | Array of change snapshots waiting for folder access |

Change types are `notes`, `habit`, `habit-delete`, and `blocked-sites`. Each carries the complete affected data, so replaying them in order is idempotent: later snapshots replace earlier ones. A failed write leaves the change queued.

## Folder layout

```
BlankWall/
  notes/2026-11-24.md
  habits/001-short-title.md
  blocked-sites.json
```

Dates and clock times in files use local time. Storage keeps ISO timestamps.

### Notes

One file per day. Entries are newest-first in the dashboard but are written in storage order in the file.

```markdown
# 2026-11-24

## 2026-11-24 14:10 · example.com · #001
Bored at my desk again.

## 2026-11-24 14:15 · Wall
Took a short walk instead.
```

The source is `Wall` when a note has no site. ` · #001` is present only when the note is linked to a habit. Text continues until the next `## ` heading.

### Habits

One file per habit. The file name is `<id>-<slug>.md`, where the slug is a lowercase, hyphenated form of the title truncated to 40 characters. Renaming a habit removes the old file.

```markdown
---
id: 001
title: Open YouTube
trigger: Bored at desk
response: Open YouTube
reward: Quick distraction
counter: Stand up and stretch for 2 minutes
occurrences: 12
counter_used: 5
---

## Log
- 2026-11-24 14:10, counter used: yes
- 2026-11-24 15:32, counter used: no
```

Front matter values are plain when they contain only word characters, spaces, or hyphens; otherwise they are JSON-quoted. `occurrences` and `counter_used` are derived from the log on import.

### Blocked sites

`blocked-sites.json` is the `blockedSites` array as pretty-printed JSON, including each site's reminder note, counter site, and allowance settings. Older arrays are filled with the version `3` defaults on import.

## Export and import

**Export everything** downloads all `chrome.storage.local` keys (including `schemaVersion`) as a single JSON file; it is a portable snapshot, not the folder format. **Import from backup folder** reads the Markdown/JSON files above. **Import JSON file** accepts the downloaded snapshot and works in browsers without the File System Access API. Both import paths run the same validation before replacing `notes`, `habits`, and `blockedSites`, set `nextHabitNumber` to one past the highest imported habit ID, and report how many records were imported and skipped for each type. Settings, stats, and allowances are left at their current browser values because neither import source mirrors them.

Before either import replaces data, Blank Wall downloads a full JSON snapshot with the same contents as **Export everything**. If the download cannot be started, a second confirmation is required.

Import normalization rules:

- Sites: an invalid or duplicate hostname is skipped. `durationMinutes` must be greater than 0 and at most 1440, otherwise it becomes 5; `allowanceMinutes` must be at least 1 and at most 1440, otherwise it becomes 15. `notesEnabled`, `habitsEnabled`, and `allowContinue` default to `true` unless they are booleans. `note` is trimmed to 200 characters. A bare `counterSite` hostname is normalized to `https:`; an invalid value becomes empty.
- Habits: `id` must be a unique positive serial number of at least three digits; invalid or duplicate IDs are skipped. `title` is capped at 80 characters; `trigger`, `response`, `reward`, and `counterPlan` at 200. Legacy `action:` maps to `response`. Occurrences with an invalid timestamp are dropped; their `site` is capped at 200 characters and `counterUsed` is coerced to a boolean.
- Notes: `id` must be a unique non-empty string, `timestamp` must be valid, and `text` must remain non-empty after trimming to 2000 characters. `site` is capped at 200 characters. `habitId` is kept only when it matches an imported habit ID; otherwise it is omitted.
