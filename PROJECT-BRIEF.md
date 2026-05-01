# Class Points

A classroom behaviour points tracker for teachers. Award points in two taps, show live leaderboard on the classroom projector.

**Live URL:** https://points.morren.uk *(pending setup)*
**Stack:** Cloudflare Pages (static HTML only) + sql.js (local SQLite in the browser)
**Repo:** ~/Developer/class-points/

## What it does

- Load or create a local .db file on startup — all data stays on the teacher's device
- Create classes, add pupils, award individual or group points in two taps
- Live leaderboard; classroom board view for the projector (BroadcastChannel, same-origin)
- CSV export of all points data
- Save data as a timestamped .db file at any time

## Architecture notes

No server-side database. sql.js v1.12.0 runs SQLite in the browser via WebAssembly. The teacher manages their own .db file (download to save, upload to restore). Same pattern as SFL Tracker and iPad Dashboard.

Board view (board.html) receives live leaderboard updates via `BroadcastChannel('class-points-board')` — no polling, no server required.

## Phasing

- **MVP (current):** Single-user, multi-class, two-tap award, group award, leaderboard, board view, CSV export
- **Phase 2:** Avatars, sounds, animations on the board view
- **Phase 3:** Trends/reports, academic-year archive

## Key files

| File | Purpose |
|---|---|
| `index.html` | Teacher console (SPA) — sql.js, all data ops local |
| `board.html` | Classroom projector view — BroadcastChannel listener |
| `style.css` | Shared styles |
| `schema.sql` | Local SQLite schema (reference) |

## Working notes

Extended project notes, wireframes, GDPR brief, and Cloudflare setup notes are in:
`~/Library/Mobile Documents/com~apple~CloudDocs/Tech and Apps/01-active/Class Points Tracker/`
