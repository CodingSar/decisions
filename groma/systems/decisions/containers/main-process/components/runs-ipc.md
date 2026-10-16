---
type: C4 Component
title: Runs handlers
status: stable
groma:
  id: runs-ipc
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/runs/main/index.ts
      symbol: registerRuns
description: Creates, starts and stops Runs
---

Keeps Runs and their terminal scrollback in memory, starts an Agent Runtime session in the Project folder with the MCP URL, relays pty I/O, and points a new Run at existing `.decisions/`.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/runs/main/index.ts](../../../../../../src/slices/runs/main/index.ts) | [src/slices/agent-runtimes/main/index.ts](../../../../../../src/slices/agent-runtimes/main/index.ts) | Starts agent sessions | function call |
