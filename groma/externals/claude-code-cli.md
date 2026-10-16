---
type: C4 System
title: Claude Code CLI
status: stable
groma:
  id: claude-code-cli
  technology: pty, MCP
---

Interactive `claude` agent run in a pty. Calls the app's `request_decision` MCP tool when it needs the human.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [claude-code-cli](claude-code-cli.md) | [src/slices/agent-runtimes/mcp.ts](../../src/slices/agent-runtimes/mcp.ts) | Requests Decisions | MCP over HTTP |
