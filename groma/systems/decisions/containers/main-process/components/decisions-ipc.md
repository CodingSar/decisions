---
type: C4 Component
title: Decisions handlers
status: stable
groma:
  id: decisions-ipc
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/decisions/main/index.ts
      symbol: registerDecisions
description: Takes requests and stores Verdicts
---

Persists each agent Decision request as pending, blocks the agent's call until the human's Verdict arrives, then saves the Verdict and releases the agent with its reply text.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/decisions/main/index.ts](../../../../../../src/slices/decisions/main/index.ts) | [src/slices/decisions/store/index.ts](../../../../../../src/slices/decisions/store/index.ts) | Reads and writes Decisions | fs |
