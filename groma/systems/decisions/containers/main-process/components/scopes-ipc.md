---
type: C4 Component
title: Scopes handlers
status: stable
groma:
  id: scopes-ipc
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/scopes/main/index.ts
      symbol: registerScopes
description: Serves Scope settings
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/scopes/main/index.ts](../../../../../../src/slices/scopes/main/index.ts) | [src/slices/scopes/store/index.ts](../../../../../../src/slices/scopes/store/index.ts) | Reads and writes Scopes | fs |
