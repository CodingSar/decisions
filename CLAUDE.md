# decisions

<!-- TODO: one line on WHAT this project is and WHY it exists. -->

## Commands
<!-- TODO: fill once stack exists. Only commands Claude can't guess. -->
- Install: `npm install` (postinstall fetches the Electron binary)
- Test single file: `npm test -- <name>.feature` (builds, runs bddgen, then Playwright; name filters generated specs). Full: `npm test`. Only features listed in `playwright.config.ts` run; add each slice's feature there when you implement its steps
- Typecheck / lint: `npm run typecheck`, `npm run lint` (Biome; `./node_modules/.bin/biome check --write .` to fix)
- Build: `npm run build` (electron-vite, output in `out/`). Dev: `npm run dev`

Run typecheck + only the tests for what you changed after every series of changes (`npm test -- <name>.feature`); run the full suite once, before declaring a task done. Show the output as evidence; never claim "done" without a passing check. If no check exists for the change, write one first.

## Workflow
- Non-trivial change (multi-file, unfamiliar code, unclear approach): research -> plan -> implement. If the diff fits in one sentence, skip the plan.
- Research documents the code as it is. No proposed changes. Cite `file:line`.
- Plans name files to change, phases, and a concrete verification step per phase. No open questions left in a final plan.
- Before building a feature, interview me about unclear points (use AskUserQuestion) until the design is resolved. Don't guess requirements.
- Implement one phase at a time. Stop and flag if reality differs from the plan.
- Bugs: reproduce with a failing test first, fix root cause, keep the regression test. Don't suppress errors.
- Tests: E2E and BDD only. No unit tests (deliberate experiment). Bugs and features start from a failing BDD scenario. Small vertical slices: one failing scenario, make it pass, refactor.
- Parsimony: KISS, concise by default (code, docs, UI, Decision text). Minimal files and fields. Verbosity costs tokens and HITL attention.
- UI is visual first: icons over text, no visible keyboard-hint bars. Every icon control shows a tooltip on hover with its name and shortcut (e.g. "Like (L)"). Text only where an icon can't carry the meaning.
- Whatever has focus (pane, card, control) shows a soft orange border and glow (accent, ~55% alpha). Pane resize handles stay neutral (`--line`), never accent.
- UI first: mock in the Claude design tool and review with the user before building a screen.
- Use cases first: write use cases, walk through them with the user, derive specs from them before implementing.
- Small, deliberate steps. Don't expand scope beyond the request.

## Context hygiene
- Delegate broad searches and file sweeps to subagents; take back summaries, not file dumps.
- Unrelated task -> suggest `/clear`. Corrected twice on same issue -> suggest `/clear` and a sharper prompt.
- When compacting, preserve: modified files, test commands, current plan and status.
- Long work: write progress to a file (goal, approach, done, current failure) so a fresh session can resume.

## Conventions
- Follow existing code patterns over inventing new ones. Formatting and style belong to the linter/formatter, not to you.
- Vertical slices, same shape everywhere: see `docs/adr/0002-vertical-slices.md`. Import a slice only via its `index.ts`.
- Use domain terms from `GLOSSARY.md` (create it when jargon appears) in code, names, and discussion.
- Record non-obvious architectural decisions as short ADRs in `docs/adr/`.
- Git: small commits, imperative subject, explain why. Don't commit or push unless asked. Never force-push.
- Use `gh` for GitHub work.

## Docs (read only when relevant)
<!-- Progressive disclosure: point at files, don't inline content. -->
- `GLOSSARY.md`: project vocabulary
- `docs/adr/`: decision records
- `docs/plans/`: dated plans, `YYYY-MM-DD-description.md`; start with `docs/plans/2026-10-16-mvp-status.md`
- `docs/use-cases.md`: approved use cases; `docs/mock/`: UI mock source

## Tools
- Library/API docs: use Context7 MCP (`use context7`), not memory. Training data goes stale.
- Tessl: MCP configured in `.mcp.json`; use it to find/install public plugins and docs.
- Specs: the `.feature` Gherkin files in each slice's `spec/` (ADR 0002; shell ones in `src/shell/spec/`) are the spec of record; `docs/use-cases.md` is the narrative.
- Tasks: Backlog.md (`backlog` CLI, tasks in `backlog/`). One task per vertical slice or scenario group. Check `backlog task list` before starting work. "Next task" = lowest-ordinal unblocked To Do/In Progress task (order and why in `docs/plans/2026-10-16-mvp-status.md`). When planning tasks, order them by dependency (set `--ordinal` and `--dep`), never arbitrarily.
- Feature design: run `/grill-with-docs` (mattpocock-skills plugin) before building. It updates `GLOSSARY.md` and ADRs inline.

## Gotchas
- E2E tests launch the built app from `out/`; `npm test` rebuilds first. Running `bddgen`/`playwright` alone uses a stale build.
- Step defs live in `src/**/spec/steps.ts`; shared fixture (launches Electron) in `src/shared/testing/fixtures.ts`.
<!-- TODO: add only mistakes Claude actually made. Each line must pass: "would removing this cause errors?" -->


<!-- groma:start -->
## Groma

This project uses Groma. Before you scan, inspect, or curate architecture, or change files for a Backlog task, run `groma agent-instructions` and read the guide it names for that job. When it reports a first scan, ask the user whether they want you to curate the architecture. Do not edit Groma-owned architecture files directly.
<!-- groma:end -->
