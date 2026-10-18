# Implementation plan: non-blocking agents (the spine)

Scope approved (Decision, option 1): orphan fix, soft ask + `check_decisions`, unseen-Verdicts startup line, `inform`. Feed order, snooze, bulk Accept and efficiency items are out; see `2026-10-18-ideas.md`.

Rules: one phase at a time, each starts from a failing BDD scenario (fake adapter, "an agent requests..."), then green, then refactor. Add each new feature to `playwright.config.ts`. After each phase: `npm run typecheck`, `npm run lint`, `npm test -- <name>.feature`. Full `npm test` once at the end. Stop and flag if reality differs.

Resolved design (no open questions):
- Soft ask = `blocking: "soft"` on `request_decision`. Default stays hard.
- Soft returns at once: `Parked D<n>; proceed on option <k> (recommended). Verdict later via check_decisions.` Decision file is `status: pending`, so it shows in the Feed like any card.
- Delivered marker, inverted: `undelivered: true` frontmatter on an answered Decision whose Verdict reached no agent (set when answered with no waiter; cleared by `check_decisions` or the startup line). Inverted so existing files need no migration. Plain file, git-visible (ADR 0003).
- `check_decisions` returns answered, undelivered Decisions raised by the calling Run (`run` field), then marks them delivered. Nothing pending: `No new Verdicts.`
- Startup line lists undelivered answered Decisions of the Project (any Run, since the old Run is gone) and marks them delivered; if none, the existing pointer line.
- `inform` (`agent`, `scope`, `summary`, `reason`, optional `components`) writes an answered Decision `by: auto`, `reason: informed`, already delivered, into Review. Per-Run cap 20/hour; over cap returns an error telling the agent to ask instead.
- Orphan: Run stop or HTTP close drops the waiter; Decision stays pending with `orphaned: true` in memory/UI only (derived: pending, hard, no waiter). Card shows an icon with tooltip "Agent gone, Verdict goes to the next Run (J)".

## Phase 1: Orphan cleanup
Files: `src/slices/agent-runtimes/mcp.ts` (res `close` calls an `onAbort`), `src/slices/decisions/main/index.ts` (remove `waiting` entry; expose orphan set), `src/slices/runs/main/index.ts` (stop calls it), `src/slices/decisions/ui/Feed.tsx` (icon).
Scenario (decisions spec): "a stopped Run's pending Decision shows as orphaned"; answering it still writes the Verdict file and does not error.
Verify: `npm test -- take-decision.feature`.

## Phase 2: Delivered marker + unseen-Verdicts startup line
Files: `src/slices/decisions/model.ts` (field, parse/serialize, `verdictText` unchanged), `store/index.ts`, `src/slices/runs/main/index.ts` (replace `POINTER` build, line ~8/102), `decisions/main/index.ts` (mark delivered on hard reply).
Scenario (runs spec): "a new Run's first prompt lists Verdicts the previous Run never received", and "a delivered Verdict is not listed again".
Verify: `npm test -- <runs feature>`, then the decisions feature for regressions.

## Phase 3: Soft ask
Files: `mcp.ts` (add `blocking` enum to schema, one-line description; keep the schema small), `decisions/main/index.ts` `request()` (soft branch returns without a Promise; no timeout ticking for soft cards).
Scenario: "a soft ask returns the recommendation at once and the card stays pending"; "answering a soft card records the Verdict and the card leaves the Feed".
Verify: `npm test -- take-decision.feature`.

## Phase 4: check_decisions
Files: `mcp.ts` (second tool), `decisions/main/index.ts` (`undelivered(run)`), shared model helper for the response text.
Scenario: "after the human answers a parked Decision, check_decisions returns its Verdict once", "returns 'No new Verdicts.' afterwards", "a Verdict from another Run is not returned".
Verify: `npm test -- take-decision.feature`; fake adapter drives both tools.

## Phase 5: inform
Files: `mcp.ts` (third tool), `decisions/main/index.ts` (reuse the out-of-Scope write at :121-134 with `reason: informed`, delivered), cap counter, `review` UI label if reason text is shown.
Scenario (review spec): "an informed action appears in Review and does not appear in the Feed", "the 21st inform in an hour is refused".
Verify: `npm test -- review.feature`.

## Phase 6: Docs and wrap-up
Files: `GLOSSARY.md` (Soft ask, Parked, Delivered, Inform, Orphaned), ADR 0012 "Non-blocking asks" (why soft/check over push, ADR 0005 stateless kept), `docs/use-cases.md` (new UC13, walk through with the user before treating as approved), `docs/plans/2026-10-16-mvp-status.md`, Backlog tasks one per phase with `--ordinal` and `--dep` in the order above.
Verify: full `npm run typecheck && npm run lint && npm test`; show output.

## Risks to watch
- Agents ignore `check_decisions`: mitigate in the tool description and the soft-ask return text.
- Overturn after an agent acted on a soft default: the existing Overturn creates a superseding Decision; `check_decisions` returns it as a new Verdict.
