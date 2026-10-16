# TASK-6 plan: take a Decision

Spec: `src/slices/decisions/spec/take-decision.feature` (9 scenarios). Design resolved in the grill session; UC4, ADR 0003. One failing scenario at a time; after each phase run `npm run typecheck` and `npm test -- take-decision.feature`.

## Decisions (settled)
- `Verdict` gains `option?: number`. Agent gets plain text: `Approved: B[. comment]`, `Rejected: reject the recommendation completely`, `Direction: <comment>`.
- One loopback MCP server, path per Run (`/mcp/<runId>`); the Run knows its Project (cwd). Steps play the agent as an MCP client against the URL from `agent:mcp-url`.
- `.decisions/D<n>.md` written `status: pending` on request, updated in place on Verdict (`by: human`, `## Verdict`). ID = max+1, allocated in main per Project. Feed = scan of pending files.
- Dropped call / stopped Run: card stays pending; later Verdict goes to the file only.
- No Scope routing (TASK-4/7): `.decisions/config.json` holds taken Scopes, all requests In-Scope.
- UI: Feed/History icon switcher in the Project tab, pending badge on the Project tab, bare read-only History. Keys act on the oldest pending card (soft orange glow); mouse focus is TASK-9.
- Next Run prompt gets one pointer line when `.decisions/` has any `D<n>.md`.

## Files
- `src/slices/decisions/model.ts`: `Decision`, parse/serialize, Verdict to agent text (no I/O)
- `src/slices/decisions/store/index.ts`: read/write `.decisions/`, next ID
- `src/slices/decisions/main/index.ts`: `registerDecisions`: pending requests (awaiting promises), IPC `decisions:list|changed|verdict`
- `src/slices/decisions/ui/{Feed,Card,History}.tsx`, `index.ts`
- `src/slices/decisions/spec/steps.ts`
- edit `agent-runtimes/{model,mcp}.ts` (`option`, runId path, tool timeout env in claude-code adapter), `runs/main` (per-Run URL, Run cwd, pointer line), `shell/main.ts` (wire), `projects/ui/Projects.tsx` (badge, switcher), `playwright.config.ts`, `GLOSSARY.md` (done)

## Phases
1. **Request appears in Feed**: wire per-Run MCP path to `registerDecisions`, write pending file, Feed card (Scope, agent label, question, options, recommended mark), tab badge. Verify: scenario 1 green; file exists with `status: pending`.
2. **Like**: L sends Verdict, file updated (`by: human`), tool call returns `Approved: A`, card leaves Feed, badge drops. Verify: scenarios "Like approves".
3. **Pick option, Dislike**: A/B/C and D. Verify: scenarios 3, 4.
4. **Comment, cancel**: inline box, Enter sends, Esc keeps pending, empty ignored. Verify: scenarios 5, 6.
5. **Oldest first**: focus moves to next card after a Verdict. Verify: scenario 7.
6. **History**: bare list, newest first. Verify: scenario 8.
7. **Run stopped while blocked**: Verdict on an orphaned pending card writes the file only; next Run prompt carries the pointer line; Claude Code adapter raises MCP tool timeout (check var via Context7). Verify: scenario 9; full `npm test`, `npm run lint`.
8. **Close out**: tick TASK-6 AC, update `2026-10-16-mvp-status.md`. User commits.

## Risks
- Pending cards must survive relaunch: the Feed reads files, not memory. Covered by phase 1 design, exercised in phase 7.
- `Verdict` shape change touches `agent-runtimes` (TASK-2, done): keep its feature green.

## Status
Done: all 9 scenarios pass, typecheck + Biome clean, TASK-6 Done. Not committed.
- Changed from plan: tool has required `agent` input; options are numbered 1-4 and picked with digit keys (L/D/C stay actions); `Verdict` lives in `decisions/model.ts`.
- Feed/History switcher lives in `shell/ui/App.tsx` (F/H keys, tooltips), not in the Project tab.
- Claude Code adapter sets `MCP_TOOL_TIMEOUT=86400000` (Context7: HTTP MCP calls otherwise cap at 60 s). Not exercised by a test; needs a real `claude`.
- Gaps to decide later: no Like/Dislike/Comment icon buttons yet (keys only); `.decisions/config.json` is only written by a step; no Stop button yet (`runs:stop` IPC only, TASK-5).
