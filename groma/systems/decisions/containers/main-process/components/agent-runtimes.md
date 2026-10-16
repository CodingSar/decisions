---
type: C4 Component
title: Agent runtimes
status: stable
groma:
  id: agent-runtimes
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/agent-runtimes/main/index.ts
    - scanner: typescript
      file: src/slices/agent-runtimes/claude-code/index.ts
      symbol: claudeCodeRuntime
    - scanner: typescript
      file: src/slices/agent-runtimes/fake/index.ts
      symbol: fakeRuntime
  technology: node-pty
description: Pluggable agent backends
---

Runtime registry plus adapters: Claude Code runs the interactive `claude` CLI in a pty wired to the MCP server; Fake is a test-only stub. Selected by env or setRuntime.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/agent-runtimes/claude-code/index.ts](../../../../../../src/slices/agent-runtimes/claude-code/index.ts) | [claude-code-cli](../../../../../externals/claude-code-cli.md) | Runs agent | pty |
