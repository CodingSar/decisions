# v1 inspect slices: files, git, Decision map

Design resolved by grill (UC8-UC10 in `docs/use-cases.md`, approved) and UI mocks (accepted: Files, Git, Decision map modal in the design canvas; sources in `docs/mock/`). Built. Supersedes the first three items of `2026-10-16-later-slices.md`; Flow view stays parked.

## Decisions
- Files: Monaco editing allowed; editor read-only while any Run is active (Project-wide), edit-anyway override; `.decisions/` always read-only. `.md` rendered by default.
- Git: system `git` CLI, no auth UI. Status, diff, stage, commit, push, pull, branch switch, init. No merge/rebase/conflicts, no generated messages, no commit-Decision links. Branch switch off during a Run.
- Decision map: own SVG render of `groma/` Markdown (spike first for JSON/library). `components` field (Groma ids) on Decisions. Mini map in right sidebar under terminal; zoom is a modal. Pending glow + count (rolls up); last-7-days tint.
- Layout: left sidebar Runs / Files / Git (Files directly under Runs). View tabs: Feed, Review, History, Files, Git.

## Tasks (order = dependency)
TASK-17 files browse -> TASK-18 files edit + lock -> TASK-19 git (reuses Monaco diff) ; TASK-20 decisions components -> TASK-21 Decision map.
Specs: `src/slices/{files,git,architecture}/spec/*.feature`, `src/slices/decisions/spec/decision-components.feature`. Add each to `playwright.config.ts` when its steps exist.

## Status
All built (TASK-17..21 Done). Resume from `2026-10-16-mvp-status.md`.
