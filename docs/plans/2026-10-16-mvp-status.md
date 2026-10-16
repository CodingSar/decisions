# MVP status (resume here)

Goal: single-user Electron app where the human takes Decisions raised by agents.

## Done
Backlog MVP slices, UI polish, files, git, components, Decision map. All features listed in `playwright.config.ts`.
Docs: `GLOSSARY.md`, ADRs 0001-0007, `docs/use-cases.md` (UC1-UC10 approved).
UI mock: `docs/mock/*.dc.html` (boards: Main, Collapsed, Review, NewProject, Settings, Files, Git, Architecture); private artifact https://claude.ai/artifact/KRcQmrkSKrhHbJXr7efMdP.

## To Do
- TASK-16 Settings section nav.
- TASK-15 Agent Runtime picker (parked until a second Agent Runtime exists).
Much work is uncommitted; the user commits.

## Task order (follow for "pick up next task")
MVP order is complete. Next: TASK-16, then TASK-15 (parked). Later ideas: `2026-10-16-later-slices.md`. Order lives in backlog ordinals + deps (`backlog task list --plain`).

## Assumptions made while writing features (re-check)
- Fake adapter is scriptable from steps ("an agent requests...").
- Badges are asserted as counts going up/down.
- Settings modal and History tab have no final mock.
