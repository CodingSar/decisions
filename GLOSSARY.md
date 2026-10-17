# decisions

A single-user, local-first desktop IDE for orchestrating agentic development. The human curates the Decisions an autonomous agent run needs, while the agents write the code.

## Language

**Decision**:
A question an agent raises mid-run that needs the human's judgment, carrying context, options, and the agent's recommendation.
_Avoid_: Approval, prompt, ticket, ADR

**Pending Decision**:
A Decision with no Verdict yet. It stays pending when its Run stops or its agent disconnects, until the human gives a Verdict.
_Avoid_: Open, unanswered, queued

**Verdict**:
The human's response to a Decision: a like, a dislike, and/or a comment, returned to the waiting agent.
_Avoid_: Answer, vote, reaction

**Auto-resolved Decision**:
A Decision outside the human's Decision Scopes (or past its timeout) that the agent settled on its own recommendation, kept for after-the-fact review.
_Avoid_: Implicit decision, silent decision

**Superseded Decision**:
A Decision whose Verdict the human later overturned, linked to the Decision that replaced it.
_Avoid_: Reverted, deleted

**Project**:
A folder the app has open in a tab, with its own Feed and Decision log.
_Avoid_: Workspace, repo

**Run**:
One orchestrator agent thread on a Project, plus any subagents it spawns, started from the app. Decisions raised by the subagents belong to the Run.
_Avoid_: Job, task, session

**Feed**:
The stream of pending Decisions presented for the human to Verdict.
_Avoid_: Inbox, queue, timeline

**Decision Scope**:
A category of Decision the human chooses to take personally (for example architecture, UI, UX); Decisions outside the chosen Scopes are left to the agent.
_Avoid_: Vector, topic, filter, domain

**Agent Runtime**:
A pluggable backend that runs agents and surfaces their Decisions; Claude Code is one, none is privileged.
_Avoid_: Provider, engine, model

**Dark Factory**:
An autonomous agent run that produces code with the human involved only through Decisions.
_Avoid_: Pipeline, autopilot

**Review**:
The tab listing Auto-resolved Decisions, where the human accepts or overturns them.
_Avoid_: Audit, inbox

**History**:
The tab listing every past Decision (answered, Auto-resolved, Superseded), newest first, where any non-Superseded one can be overturned.
_Avoid_: Archive, log

**Overturn**:
The human's act of replacing an earlier Verdict or Auto-resolution: it opens a new linked Decision and, once answered, makes the old one Superseded.
_Avoid_: Revert, undo

**Component**:
An element of the Project's Groma architecture model that a Decision can touch.
_Avoid_: Module, node, box

**Decision map**:
The view of the architecture colored by the Decisions that touch each Component. Two views: Overview (one level at a time, click through) and Interactions (nested, arrows on hover).
_Avoid_: Architecture view, diagram, heatmap

**In-Scope / Out-of-Scope**:
A Decision Scope the human takes personally is In-Scope (the agent waits for a Verdict); any other is Out-of-Scope (the agent decides, giving an Auto-resolved Decision).
_Avoid_: Enabled/disabled

**Adapter**:
An Agent Runtime implementation; `claude-code` is real, `fake` is test-only.
_Avoid_: Driver, plugin

**Orchestrator / Subagent**:
The Orchestrator is a Run's main agent thread; Subagents are the agents it spawns. Their Decisions belong to the Run.
_Avoid_: Worker, child

**Mini map**:
The small Decision map in the right sidebar under the terminal; zoom opens the full map in a modal.
_Avoid_: Preview

**Curate**:
To produce or refresh the Groma architecture model (`groma/`) the Decision map reads.
_Avoid_: Generate, scan

**Edit anyway**:
The override that unlocks the read-only editor while a Run is active.
_Avoid_: Force edit

**Terminal session**:
A coding agent started in a Project folder outside the app. Its Decisions reach the Feed like a Run's, but it has no Run, no lock and no pane (ADR 0011).
_Avoid_: External run

**Terminal**:
The pane that shows the selected Run's session (xterm). The only place git is used (ADR 0009); it also marks where Decisions were raised and reports the agent's activity.
_Avoid_: Console, shell

**Mock-up**:
A self-contained HTML board an agent proposes for an impactful UI change, attached to a Decision; `-for-approval` in its name until the app renames it `-approved` on an approving Verdict.
_Avoid_: Screenshot, design, preview

**Mark**:
One instruction the human puts on a Mock-up in the Inspector: remove an element, move it onto another, or a one-line note on it; sent to the agent as a text line in the Verdict.
_Avoid_: Annotation, comment pin, drawing

**Inspector**:
The modal that shows a Mock-up at full size with its Marks and the Before/After toggle against the last approved Mock-up.
_Avoid_: Lightbox, viewer
