# MVP status (resume here)

Goal: single-user Electron app where the human takes Decisions raised by agents. Design is resolved; nothing is built.

## Done
- Grill session, `GLOSSARY.md`, ADRs 0001-0003, `docs/use-cases.md` (UC1-UC7 walked through and approved).
- Specs: `.feature` files in `src/slices/*/spec/` and `src/shell/spec/` (52 scenarios, approved by the user, never run).
- Tasks: Backlog.md, TASK-1..9 (`backlog task list --plain`). OpenSpec removed on purpose.
- UI mock: `docs/mock/*.dc.html` (source) and https://claude.ai/artifact/KRcQmrkSKrhHbJXr7efMdP (private; published latest version). Boards: Feed, Collapsed, Review, NewProject, Settings. Not yet mocked: History tab, History icon on the Review/Collapsed boards, New Run plus picker on Collapsed/Review.

## Progress
TASK-1-9 done (55 scenarios pass). MVP specs all green.

## Next
1. TASK-1 scaffold: Electron + TS + React + playwright-bdd on Playwright's Electron driver; fill the `TODO` commands in `CLAUDE.md`; show a passing trivial scenario.
2. TASK-2 agent-runtimes (fake first, scriptable from steps), then slices in task order; one failing scenario at a time.
3. Nothing is committed; the user commits.

## Task order (follow for "pick up next task")
TASK-6 take -> TASK-4 scopes -> TASK-7 auto-resolve -> TASK-3 projects (finish the 2 skipped scenarios) -> TASK-8 overturn + History -> TASK-5 runs (finish) -> TASK-9 shell.
Why: 7 needs 4's Scope config and 6's store/Feed; 3's skipped scenarios and 8 need 6/7; 9 lays out the finished panes. Encoded as backlog ordinals + deps (`backlog task list --plain`).

## Assumptions made while writing features (re-check)
- Fake adapter is scriptable from steps ("an agent requests...").
- Badges are asserted as counts going up/down.
- Settings modal and History tab have no final mock.
