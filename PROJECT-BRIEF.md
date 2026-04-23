# Class Points

A classroom behaviour points tracker for teachers. Award points in two taps, show live leaderboard on the classroom projector.

**Live URL:** https://points.morren.uk *(pending setup)*
**Stack:** Cloudflare Pages + Pages Functions + D1 (SQLite)
**Repo:** ~/Developer/class-points/

## What it does

- Teachers sign in via magic-link email (no passwords)
- Create classes, add pupils, award individual or group points
- Real-time leaderboard, classroom board view for the projector
- Invite colleagues to co-teach a class
- CSV export of all points data

## Phasing

- **MVP (current):** Single class, two-tap award, leaderboard, board view, CSV export
- **Phase 2:** Multi-class, co-teach invites
- **Phase 3:** Avatars, sounds, animations on the board view
- **Phase 4:** Trends/reports, academic-year auto-archive

## Key files

| File | Purpose |
|---|---|
| `index.html` | Teacher console (SPA) |
| `board.html` | Classroom projector view |
| `style.css` | Shared styles |
| `functions/api/` | Pages Functions API (23 endpoints) |
| `schema.sql` | D1 database schema |
| `wrangler.toml` | Cloudflare config |
| `SETUP.md` | Deployment instructions |

## Working notes

Extended project notes, wireframes, GDPR brief, and Cloudflare setup notes are in:
`~/Library/Mobile Documents/com~apple~CloudDocs/Tech and Apps/01-active/Class Points Tracker/`
