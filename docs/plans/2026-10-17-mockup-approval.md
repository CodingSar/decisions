# Mock-up approval (TASK-45)

Goal: an agent proposes impactful UI changes as a Mock-up; the human approves it in the Feed like any Decision, with marks (remove, move, note) that go back to the agent as revision instructions.

## Ideation (three research passes, 2026-10-17)

Visualizing change
- 1-up before/after toggle beats side-by-side for change detection (Josephs, Drew & Wolfe 2015); Chromatic/Percy/Argos all offer it. Default compare = toggle (T) against the last approved Mock-up.
- Thumbnail = whole screen, never a crop; change badge, not pixel heatmaps. Keyboard-first.
- Pixel diffs are semantically blind: the agent's one-line question plus the human's marks carry the meaning.

Cognitive load in approval feeds
- One card in focus, compact unless focused, fixed-ratio thumbnail so images do not dominate text cards (UF eye-tracking: images draw ~2x attention).
- Single-key verdicts, auto-focus next (Linear triage, Superhuman). Rejection must carry a reason the agent can act on (LangChain/Symbolica HITL).
- Automation bias is real: keep the recommendation star, no "approve" default button.

Annotation to instruction and state in files
- Industry converged on mark + element identity + short imperative text (Vercel "Copy for agents", stagewise, Lovable, Figma pins). Freehand drawing was tried and dropped (Vercel).
- Models are bad at raw coordinates and good at named marks (Set-of-Mark): send `remove: button "Sort"`, not pixels.
- Approval as file promotion (BackstopJS, Loki, Playwright snapshots): the approved file is the reference the next proposal is compared against.
- No library earns its weight: iframe + overlay + `elementFromPoint` is ~200 lines, zero deps.

Trade-off taken: the user asked for state in the filename (`-for-approval` -> `-approved`). Research prefers a sidecar for stable paths. Filename wins: it is what the agent and the human see in the file tree without parsing, and a Mock-up is a disposable artifact, not a linked document.

## Design (approved mock: `docs/mock/Mockup.dc.html`)

Convention (ADR 0010)
- Agent writes `docs/mock/<name>-for-approval.html` (a round number may precede: `<name>-2-for-approval.html`), then calls `request_decision` with `mockup: "docs/mock/<name>-for-approval.html"`. Self-contained HTML (inline CSS), 1440x900 board like the existing `.dc.html` files.
- Approved Verdict: the app renames the file to `docs/mock/<name>-approved.html`, replacing an earlier approved one. Reject or direction: name unchanged; the agent revises in place and asks again.
- The previous `<name>-approved.html`, when present, is the Before image of the toggle.
- Invalid `mockup` (missing file, outside the Project, no `-for-approval`) is an MCP error; no Decision is created.

Feed card
- A Mock-up card shows a scaled whole-screen thumbnail under the question (sandboxed iframe, scripts off). Compact when unfocused.
- Click or `M` opens the Inspector. Like/Dislike/Comment/options behave as today.

Inspector (modal `role="dialog"`, aria-label "Mock-up")
- Header: file name, tools Note (N) and Remove (X), Before/After toggle (T, only with an approved file), Undo (⌘Z), Close (Esc).
- Body: the Mock-up at fit scale with a transparent overlay. Click = mark with the active tool; drag = Move mark (arrow from element to drop target). Marks are numbered badges.
- Footer: the marks as one line each, then Like (L), Dislike (D), Comment (C). Marks ride along with any Verdict as extra lines.

Verdict text to the agent (one mark per line, element = `tag "text"` or `#id`)
```
Rejected: revise the mock-up
- remove: button "Sort"
- move: button "Save" -> header "api-service"
- note on input "Search": make it wider
```

## Phases (each: failing scenario -> pass -> refactor; `npm run typecheck && npm test -- approve-mockup.feature`)

1. `mockup` field: `DecisionRequest`, MCP input (describes the convention), `Decision` frontmatter `mockup:`; validation in `registerDecisions.request`. Scenario: "An agent proposes a Mock-up" (card shows thumbnail) and "A Mock-up outside the convention is refused".
2. Inspector with marks: `M` opens, Remove click, Move drag, Note click; Dislike sends `Rejected:` with mark lines. Scenario: "Marks tell the agent what to change".
3. Rename on approval: Like renames `-for-approval` to `-approved`. Scenario: "Approval promotes the file".
4. Before/After toggle against the approved file. Scenario: "Toggle shows the approved Mock-up".
5. Agent guidance: the `mockup` field's description in the request_decision schema carries the convention (the Run's prompt pointer stays as is). Full `npm test`, docs, commit.

Verification per phase: the named scenario passes, typecheck and lint are clean. Done: full suite green.

## Status
Phases 1-5 done (2026-10-17): `approve-mockup.feature` passes (5 scenarios). See git log on `claude/happy-rubin-ppdtc6`.
