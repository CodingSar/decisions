# MVP status (resume here)

Goal: single-user Electron app where the human takes Decisions raised by agents.

## Done
Backlog MVP slices, UI polish, files, components, Decision map, terminal modernization (TASK-26..30, `2026-10-16-terminal-modernization.md`). The git slice was built and then removed (TASK-31): git happens in the Run terminal. All features listed in `playwright.config.ts`.
Docs: `GLOSSARY.md`, ADRs 0001-0007, `docs/use-cases.md` (UC1-UC10 approved; UC9 removed).
UI mock: `docs/mock/*.dc.html` (boards: Main, Collapsed, Review, NewProject, Settings, Files, Architecture); private artifact https://claude.ai/artifact/KRcQmrkSKrhHbJXr7efMdP.

## To Do
- TASK-32 UX review (`2026-10-16-ux-review.md`): walk the use cases as a first-time user, fix friction.
- TASK-16 Settings section nav.
- TASK-15 Agent Runtime picker (parked until a second Agent Runtime exists).
- TASK-22..25 Decision map extras.

## Task order (follow for "pick up next task")
Next: TASK-32, then TASK-16, then TASK-15 (parked). Later ideas: `2026-10-16-later-slices.md`. Order lives in backlog ordinals + deps (`backlog task list --plain`).

## Assumptions made while writing features (re-check)
- Fake adapter is scriptable from steps ("an agent requests...").
- Badges are asserted as counts going up/down.
- Settings modal and History tab have no final mock.
