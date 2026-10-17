# MVP use cases

Actor: the human (single user). Terms per `GLOSSARY.md`.

## UC1 Open a Project
1. A new tab offers: open an existing folder, or set up a new project. Any folder works; git is not required.
2. Set up: a native folder picker (can create a folder). The app adds the missing `.mcp.json` (decisions, context7, tessl), `.claude/settings.json` (interview plugin) and `CLAUDE.md`, installs the plugin, then the setup interview (grilling skill) runs in the terminal; it writes GLOSSARY.md and ADRs. If the plugin cannot be installed, the terminal says so first.
3. The folder appears as a Project tab; the app creates `.decisions/` on first use. Opening an already-open folder focuses its tab.
4. On launch, all previously open Project tabs return, last-active focused, with Feed and past Decisions. Runs do not resume; pending Decisions from stopped Runs still show.
5. A remembered folder that was moved or deleted shows its tab as unavailable, with a close icon.

## UC2 Configure Decision Scopes
1. A gear icon at the bottom of the sidebar opens a per-Project settings modal (more Project settings can join later). Its first section is Decision Scopes.
2. A new Project starts with all seeded Scopes marked mine (toggle on). Human toggles off the ones they don't take personally; those Decisions are Auto-resolved.
3. Human may add a Scope, delete a user-added one (old Decisions untouched; seeded Scopes can only be toggled), and set a timeout per Scope (default: none).
4. Stored per Project in `.decisions/config.json`. An unknown Scope from an agent counts as In-Scope; the tool schema lists the valid Scopes.

## UC3 Start a Run
1. A plus icon in the sidebar Runs header creates a new Run (named R<n>, click to rename). A picker icon in the terminal header chooses its Agent Runtime (Claude Code is the only entry in v1; the Fake adapter is test-only and hidden).
2. Human presses the start icon in the terminal header; no dialog. App starts the orchestrator in the terminal pane and injects the `request_decision` tool. The human types the task there.
3. Start and stop act on the selected Run. Start is idempotent: greyed out while that Run runs, so only stop is active. Several Runs may go in parallel; the terminal shows the selected Run.
4. Selecting a stopped Run shows its scrollback read-only (kept until the app closes; after a restart only its name and Decisions remain).
5. If the `claude` CLI is missing or not logged in, the terminal shows its error and the Run is marked failed. No setup wizard.

## UC4 Take a Decision
1. An agent (orchestrator or subagent) calls `request_decision`: Scope, one-line question, 2-4 one-line options, recommended option.
2. In-Scope: card appears in the Feed (oldest first), labeled with the asking agent; the agent blocks.
3. Human gives a Verdict by keyboard: Like (L) approves the recommended option; pressing an option number (1-4) picks and likes that option; Dislike (D) rejects; Comment (C) opens an inline box (Enter sends, Esc cancels). A comment alone means "none of these, here is my direction".
4. Verdict returns to the asking agent, which continues. Decision is saved. The card leaves the Feed, focus moves to the next oldest card, and the answered Decision appears in History.
5. If the Run stops while an agent is blocked, the card stays pending; a later Verdict is saved to the file and the next Run picks it up.
6. A new card raises the badge count on its Project tab. No sounds or OS notifications in v1.

## UC5 Auto-resolve a Decision
1. Out-of-Scope Decision, or an in-Scope one past its timeout: the agent proceeds on its recommendation.
2. Decision is saved as Auto-resolved (`by: auto`, reason `out-of-scope` or `timeout`) and listed in the Review tab. Human Verdicts are `by: human`.
3. Timeouts count only while the app runs and the agent is blocked; closing the app leaves the Decision pending. While the human is working on any card (comment box open), the timers of all cards pause.
4. Review lists only Auto-resolved Decisions, newest first; unseen ones carry a badge, cleared by accepting.

## UC6 Review and overturn
1. Human scans the Review tab (Auto-resolved Decisions: accept or overturn) and the History tab (every past Decision: answered, auto-resolved, superseded; newest first; overturn only).
2. Overturn works on any Decision that is not already Superseded, including ones the human answered. It creates a new pending In-Scope Decision with the old question and options, opened with a comment box; the human picks an option or writes direction. Cancelling leaves the old Decision unchanged.
3. Once the new Verdict is saved, the old Decision becomes Superseded (struck through, "superseded by D<n>") and the new one carries `supersedes: D<old>`. Overturning an overturn works; only the latest is active.
4. A running asking agent is not interrupted; the next Run is pointed at `.decisions/` and finds the new Verdict.

## UC7 Work across Projects and Runs
1. Human switches Project tabs; each has its own Feed and Runs.
2. Focus follows the mouse: hovering a focus unit (a Feed card, the terminal view, or the sidebar) for 150 ms focuses it, and hovering elsewhere moves focus away. The focused unit shows a soft orange border. There is no typing pin.
3. ⌘1/2/3 focus the sidebar, Feed and terminal; ⌘⇧[ / ⌘⇧] switch Project tabs and ⌘⇧1..9 jumps to a Project tab. A keyboard focus move suspends mouse focus until the mouse moves again.
4. Sidebar and terminal are resizable by dragging their edge, and hide with a minus icon. A hidden pane leaves an edge strip with an arrow that shows it again. Widths and hidden state are remembered per app (app data, not `.decisions/`).
5. An x icon on a Project tab closes it and stops its Runs; a confirmation appears only if a Run is active. Its Decisions stay in `.decisions/` and return on reopen.
6. Human stops a Run; its unanswered Decisions stay pending in the Feed.

## UC8 Browse and edit files
1. A Files section in the left sidebar, directly under Runs, shows the Project tree. It respects `.gitignore` and hides `.git/`; a file watcher keeps it current.
2. Clicking a file opens it in the Files view (a tab beside Feed / Review / History). Code opens in Monaco; `.md` opens rendered, with a toggle to edit source. Save is ⌘S; a dot marks unsaved changes.
3. In rendered `.md`, relative links open that file in the Files view; external links open in the system browser.
4. While any Run is active, the editor is read-only with a banner ("Run R2 is active") and an edit-anyway icon. No active Run: editing is free. The lock is Project-wide.
5. `.decisions/` is visible but always read-only (the app writes Verdicts there).

## UC9 Review and ship with Git (removed 2026-10-16)
Git stays in the Run terminal: the human asks the agent to commit, push or pull, or types `git` there. The in-app Git section and diff view were removed (TASK-31) so one tool, not two, owns the repo state.

## UC10 See Decisions on the architecture
1. `request_decision` takes an optional `components` list (Groma element ids). At Run start the app reads the ids from the Project's `groma/` and lists them in the tool description; unknown ids are dropped. The field is stored in the D-file frontmatter. An overturn copies it to the new Decision.
2. The Decision map sits in the right sidebar under the terminal (resizable, hideable). It has two views, switched by icons in its header. Overview: one level at a time (actors, externals, systems/containers at the top), with that level's arrows; clicking a container drills into its Components, Up goes back. Interactions: Containers nest their Components; no arrows at rest, hovering or selecting an element shows its arrows and dims the rest. A Component with pending Decisions glows orange with a count, rolled up to its parents. Decisions answered or Auto-resolved in the last 7 days give a faint tint. Superseded ones and Decisions without `components` do not appear.
3. Hovering a Component lists its Decisions. The expand icon (⌘⇧M), or clicking a Component, opens the Decision map as a modal over the whole window: the same map and views, larger, focused on that Component, with a side panel listing its Decisions. Esc closes it.
4. No `groma/` folder: the view shows an empty state with a button that starts a Run prompted to curate the architecture. The app never edits Groma files.
5. Parked: Flow view (stepping through Groma `flows/`), module/dependency graph, run activity heatmap.

## UC11 Approve a Mock-up
1. For an impactful UI change the agent writes `docs/mock/<name>-for-approval.html` (self-contained, 1440x900) and calls `request_decision` with `mockup` set to that path. A missing, outside or misnamed file is an error to the agent and creates no Decision.
2. The Feed card shows the whole Mock-up as a thumbnail under the question. `M` or a click opens the Inspector: the Mock-up at fit size, tools Note (N) and Remove (X), drag an element to Move it, Undo (⌘Z), Esc closes. With a previous `<name>-approved.html`, `T` toggles Before/After.
3. Marks are numbered on the Mock-up and listed under it. Like (L), Dislike (D), Comment (C) and option keys work in the Inspector as on the card; the marks are appended to the Verdict as one line each naming the element (`remove: button "Sort"`, `move: button "Save" -> header "api-service"`, `note on input "Search": make it wider`).
4. An approving Verdict renames the file to `<name>-approved.html` (replacing the earlier one). Other Verdicts leave the name; the agent revises the file in place and asks again.
5. Parked: PNG Mock-ups (marks by coordinates), pixel diff highlight, change list from the agent.

## UC12 Decisions from your own terminal
1. A coding agent started in a Project folder outside the app (its `.mcp.json` has `decisions`) calls `request_decision`; the Decision follows UC4/UC5 and shows in that Project's Feed.
2. The folder (or a parent) must be an open Project and the app running; otherwise the tool errors and the agent asks in its terminal.
3. No Run appears in the sidebar and the Run lock does not apply.

## Rules
- UC4: a dislike without a comment means "reject the recommendation completely". If that is ambiguous for the question, the agent asks for a comment in its next Decision.

- The app writes every Verdict into the Decision file itself (deterministic, no agent needed). A live agent's `request_decision` call returns it; otherwise the next Run reads it from `.decisions/`.

- IDs are `D<n>`, sequential per Project, file `.decisions/D<n>.md`; an overturn creates a new ID with `supersedes: D<n>`.
- Start run adds one line to the initial prompt pointing at `.decisions/` for answered Decisions the agent hasn't seen; no contents are injected.

## Open for the walkthrough
- None. Walkthrough of UC1-UC7 done.
