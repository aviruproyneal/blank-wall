# Data format

Blank Wall keeps browser storage as the source of truth. A folder chosen by the user is a Markdown safety copy and an import source. Nothing is sent to a server.

## Browser storage (`chrome.storage.local`)

| Key | Shape |
| --- | --- |
| `schemaVersion` | Number; current version is `2` |
| `blockedSites` | `[{ hostname, durationMinutes, notesEnabled, habitsEnabled }]` |
| `habits` | `[{ id, title, trigger, response, reward, counterPlan, occurrences: [{ timestamp, site, counterUsed }] }]` |
| `notes` | `[{ id, timestamp, site, text, habitId? }]` |
| `stats` | `{ 'YYYY-MM-DD': { walls, wallSeconds, skips } }` |
| `allowances` | `{ hostname: expiryTimestampMillis }` |
| `settings` | `{ defaultDurationMinutes, allowanceMinutes, skipRule }` |
| `nextHabitNumber` | Number; the next serial habit ID |

Habit IDs are zero-padded serial numbers (`001`, `002`, ...). Deleted IDs are not reused. `timestamp` values are ISO 8601 strings. `skipRule` is `none` or `after-habit`. Allowances are keyed by the matched blocked hostname and cover its subdomains.

Version `2` renamed the habit field `action` to `response`. The migration runs on extension update and on first read; it renames `action` when present, keeps any existing non-empty `response`, and can be run repeatedly. Older exports with `action:` front matter remain importable.

## Backup state (IndexedDB)

Database `blank-wall-backup`, object store `state`:

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

`blocked-sites.json` is the `blockedSites` array as pretty-printed JSON.

## Export and import

**Export everything** downloads all `chrome.storage.local` keys (including `schemaVersion`) as a single JSON file; it is a portable snapshot, not the folder format. **Import from backup folder** reads the Markdown/JSON files above, replaces `notes`, `habits`, and `blockedSites`, and sets `nextHabitNumber` to one past the highest imported habit ID. Habit front matter with the legacy `action:` key is mapped to `response` on import. Settings, stats, and allowances are left at their current browser values because the folder does not mirror them.
