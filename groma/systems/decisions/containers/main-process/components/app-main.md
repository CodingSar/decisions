---
type: C4 Component
title: App main
status: stable
groma:
  id: app-main
  parent: main-process
  code:
    - scanner: typescript
      file: src/shell/main.ts
description: Creates window and wires slices
---

Electron entry. Starts the MCP server, opens the window, and registers the Projects, Runs, Decisions and Scopes handlers, passing each the collaborators it needs (active Project, Run to Project lookup, MCP URL).

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/shell/main.ts](../../../../../../src/shell/main.ts) | [src/slices/projects/main/index.ts](../../../../../../src/slices/projects/main/index.ts) | Registers handlers | function call |
| [src/shell/main.ts](../../../../../../src/shell/main.ts) | [src/slices/runs/main/index.ts](../../../../../../src/slices/runs/main/index.ts) | Registers handlers | function call |
| [src/shell/main.ts](../../../../../../src/shell/main.ts) | [src/slices/decisions/main/index.ts](../../../../../../src/slices/decisions/main/index.ts) | Registers handlers | function call |
| [src/shell/main.ts](../../../../../../src/shell/main.ts) | [src/slices/scopes/main/index.ts](../../../../../../src/slices/scopes/main/index.ts) | Registers handlers | function call |
| [src/shell/main.ts](../../../../../../src/shell/main.ts) | [src/slices/agent-runtimes/mcp.ts](../../../../../../src/slices/agent-runtimes/mcp.ts) | Starts server | function call |
