# Terminal Decisions and Project setup

Goal: (1) a coding agent started in a Project folder from any terminal raises Decisions in the app, not in its own TUI; (2) "Set up a new project" prepares the folder (MCP, plugins, CLAUDE.md) so that works from the first session. Covers TASK-43.

## Research (as is)
- App MCP server: random port, path `/mcp/<runId>`; only Runs the app spawns get it via `--mcp-config` (`claude-code/index.ts:23`, `mcp.ts`, ADR 0005).
- Project `.mcp.json` has `context7` and `tessl` only; `decisions` is absent, so outside terminals have no `request_decision`.
- `CLAUDE.md` tells agents to interview via AskUserQuestion (TUI) and names `/grill-with-docs`, which `mattpocock-skills` 1.3.1 no longer ships (now `grilling`, `domain-modeling`).
- Set up (`projects:open` with setup) only opens the tab and starts a Run with `/grill-with-docs` (`shell/main.ts`).
- Probe: Claude Code expands `${PWD}` in `.mcp.json` `headers`, so a static entry can tell the app which folder the session is in.

## Design
- The MCP server prefers port 47821 (`DECISIONS_MCP_PORT` overrides; `0` = random, used by tests; falls back to random when taken).
- New route `/mcp` (no run id): the `X-Project-Dir` header names the folder. It must be an open Project (or inside one), else the tool returns an error and the agent falls back to its TUI. The Decision is stored with run `terminal` and no Run in the sidebar (no file lock, no terminal pane).
- Setup writes, never overwriting: `.mcp.json` (`decisions`, `context7`, `tessl`), `.claude/settings.json` (`mattpocock-skills` plugin), `CLAUDE.md` (default skeleton incl. the request_decision rule). Existing files are merged; present keys stay.
- Setup installs the plugin with `claude plugin install` before the Run. On failure the Run starts with a plain interview prompt and a notice in the terminal (TASK-43).
- Setup Run prompt: `grilling` skill, then install missing tools (`backlog init`, `groma`, `tessl`) via their CLIs.
- This repo gets the same files by the same function.

## Phases
1. Docs: ADR 0011, GLOSSARY (Terminal session), UC1/UC12 edits, `CLAUDE.md` fix. Check: reviewed by user.
2. Stable endpoint + `/mcp` terminal route. Scenario first: `agent-runtimes/spec/terminal-decisions.feature`. Check: `npm test -- terminal-decisions.feature`.
3. Scaffold function + setup flow. Scenarios first: `projects/spec/setup-project.feature`. Check: `npm test -- setup-project.feature`, `open-project.feature`.
4. Apply to this repo, full suite, typecheck, lint.

## Not now
UI for external sessions (a sidebar entry), `claude mcp add` automation for existing projects, Windows `%CD%`.
