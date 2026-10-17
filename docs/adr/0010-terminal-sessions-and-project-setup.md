# Terminal sessions reach the app through a stable endpoint

The MCP server (ADR 0005) prefers port 47821 and falls back to a free one. Plain `/mcp` serves coding agents started outside the app: the Project's `.mcp.json` sends `X-Project-Dir: ${PWD}`, and the folder must be (inside) an open Project, else the tool errors and the agent asks in its own terminal. Such Decisions carry run `terminal:<Project>`; no Run, lock or terminal pane exists for them.

"Set up a new project" writes `.mcp.json`, `.claude/settings.json` (interview plugin) and `CLAUDE.md` without overwriting, installs the plugin, then starts the interview Run.

Why: agents then raise Decisions in the app from any terminal, with no per-session flags. Cost: if another program holds port 47821, `.mcp.json` points at the wrong server until it is freed; the app must be running.
