# MVP status (resume here)

Goal: single-user Electron app where the human takes Decisions raised by agents.

## Done
Backlog MVP slices, UI polish, files, components, Decision map, terminal modernization (TASK-26..30, `2026-10-16-terminal-modernization.md`). The git slice was built and then removed (TASK-31): git happens in the Run terminal. All features listed in `playwright.config.ts`.
UX review (TASK-32, `2026-10-16-ux-review.md`): 40 findings, 29 quick fixes shipped with scenarios, 11 follow-up tasks (TASK-34..44). Flaky Feed key scenarios fixed (TASK-33). All follow-ups TASK-34..44 done (150 scenarios pass).
Mock-up approval (TASK-45, `2026-10-17-mockup-approval.md`, ADR 0010): `mockup` on request_decision, thumbnail in the Feed, Inspector with Marks, rename on approval, Before/After toggle.
Docs: `GLOSSARY.md`, ADRs 0001-0007 and 0010, `docs/use-cases.md` (UC1-UC8, UC10, UC11 approved; UC9 removed).
UI mock: `docs/mock/*.dc.html` (boards: Main, Collapsed, Review, NewProject, Settings, Files, Architecture, Mockup); private artifact https://claude.ai/artifact/KRcQmrkSKrhHbJXr7efMdP.

## To Do
- TASK-16 Settings section nav (parked until a second Settings section exists).
- TASK-15 Agent Runtime picker (parked until a second Agent Runtime exists).
- TASK-22..25 Decision map extras.

## Task order (follow for "pick up next task")
Next: TASK-16 and TASK-15 (both parked), then TASK-22..25 Decision map extras. Later ideas: `2026-10-16-later-slices.md`. Order lives in backlog ordinals + deps (`backlog task list --plain`).

## Assumptions made while writing features (re-check)
- Fake adapter is scriptable from steps ("an agent requests...").
- Badges are asserted as counts going up/down.
- Settings modal and History tab have no final mock.
