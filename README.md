# Road to Zones (az-swim-zones)

A free, unofficial, statically-hosted site that helps Arizona 14-and-under
swimmers and their families see how close they are to qualifying for the
**Western Zone Age Group Championship (WAGZ)** — and celebrates it when they
get there.

This is **not** Arizona Swimming (AZSI), not USA Swimming, and not a
selection tool. See the About/Disclaimer page (coming in a later build step)
for the full story.

## Status

🚧 Step 1 of the build order: repo scaffold, `config/meet.json`,
`data/standards.json`, and the core logic modules (time parsing, AAA
standard comparison, birthday-inference age grouping) with unit tests.
No UI yet — that starts at step 2 with the eligibility calculator.

## Core logic (`scripts/lib/`)

- **`time.ts`** — parses race times ("1:03.45" -> 63.45 seconds) and the
  no-time tokens (`DQ`, `NS`, `DNF`, `SCR`, `NT`, `DFS`, `X`) as `null`,
  never `0`.
- **`standards.ts`** — looks up and compares a swum time against the AAA
  standard for its **own course only** (LCM / SCM / SCY). Times are never
  converted between courses — that's explicitly forbidden by the meet.
- **`ageGroup.ts`** — maps a WAGZ age to `10U` / `11-12` / `13-14`, or
  `null` for 15+ (ineligible).
- **`ageWindow.ts`** — the birthday-inference algorithm. Public results only
  publish a swimmer's age at each meet, never a birthdate, and this project
  never collects birthdates. Instead it intersects age observations across
  meets into a bounded DOB window and resolves the swimmer's age group at
  the target meet's first day of competition — flagging `ageUncertain: true`
  whenever the window straddles two possible ages, rather than silently
  guessing.

Run the tests:

```bash
npm install
npm test
```

## Data

- `config/meet.json` — single source of truth for the target meet's dates,
  qualifying window, LSC, and Zone caps. **The 2027 date and host city are
  not yet announced** — every date in this file is a clearly-editable
  placeholder.
- `data/standards.json` — the full 2025-2028 NAG Motivational "AAA"
  standards table (all three courses, all three age groups), plus the
  narrower actual WAGZ event program used to drive the Team Builder.

## Privacy

No birthdates are ever collected or committed to this repo. Age windows are
inferred at build time from publicly published age-at-meet data and, where
persisted for monotonic improvement across refreshes, kept at month
granularity in `data/internal/age-windows.json` — a file the site build
never reads from or renders.
