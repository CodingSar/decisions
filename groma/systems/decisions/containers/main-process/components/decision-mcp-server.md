---
type: C4 Component
title: Decision MCP server
status: stable
groma:
  id: decision-mcp-server
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/agent-runtimes/mcp.ts
  technology: MCP streamable HTTP
description: Serves request_decision to agents
---

Loopback HTTP MCP endpoint exposing the `request_decision` tool. Validates scope, question, options and recommendation, then forwards to the Decisions handler with the Run ID taken from the URL.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/agent-runtimes/mcp.ts](../../../../../../src/slices/agent-runtimes/mcp.ts) | [src/slices/decisions/main/index.ts](../../../../../../src/slices/decisions/main/index.ts) | Forwards Decision requests | callback |
