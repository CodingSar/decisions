---
type: Groma Flow
title: Take a Decision
groma:
  id: take-a-decision
---

A running agent asks a question; the human gives a Verdict that releases the agent.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Claude Code CLI](../externals/claude-code-cli.md) | [Decision MCP server](../systems/decisions/containers/main-process/components/decision-mcp-server.md) | Call request_decision |
| [Decision MCP server](../systems/decisions/containers/main-process/components/decision-mcp-server.md) | [Decisions handlers](../systems/decisions/containers/main-process/components/decisions-ipc.md) | Forward request |
| [Decisions handlers](../systems/decisions/containers/main-process/components/decisions-ipc.md) | [Decision store](../systems/decisions/containers/main-process/components/decisions-store.md) | Save pending Decision |
