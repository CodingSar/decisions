# Ideation plan: non-blocking agents, approval flow, efficiency

Goal: find improvements to the approval flow, workflow and efficiency, centred on one question: how do agents keep running while Decisions wait for the human?

## Method
Research documents the code as it is (cite `file:line`); ideas come after, labelled as proposals. Three read-only subagents in parallel, each with its own lens:

1. **Blocking mechanics**: how `request_decision` (ADR 0005) waits today, what blocks the agent, what happens on app close, timeout, crash, restart. Lens: async/non-blocking patterns (park-and-continue, deferred answers, resume, batching, defaults on timeout).
2. **Approval flow & workflow**: UC1-UC12, Feed, Inspector, Mock-up approval, keys. Lens: human attention cost, triage, batching, default answers, "ask later" vs "ask now", urgency.
3. **Efficiency**: tokens, latency, files-as-state (ADR 0003, 0007), Decision text size, polling vs watching, multi-agent / multi-Project load. Lens: parsimony.

## Output
Each agent returns <= 40 lines: (a) current behaviour with citations, (b) 5-8 ranked ideas (value, cost, risk), (c) what it ruled out.

## Then
Synthesize into `docs/plans/2026-10-18-ideas.md`, pick winners with the user via `request_decision`, then write `docs/plans/2026-10-18-implementation-plan.md` (phases, files, BDD scenario per phase, verification per phase).
