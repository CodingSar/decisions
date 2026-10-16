---
type: C4 Component
title: IPC bridge
status: stable
groma:
  id: ipc-bridge
  parent: main-process
  code:
    - scanner: typescript
      file: src/shell/preload.ts
  technology: Electron contextBridge
description: Exposes invoke/on to the renderer
---

Preload script. Only channel through which the renderer calls main-process handlers and receives pushed events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | [src/slices/runs/main/index.ts](../../../../../../src/slices/runs/main/index.ts) | Dispatches calls | Electron IPC |
| [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | [src/slices/decisions/main/index.ts](../../../../../../src/slices/decisions/main/index.ts) | Dispatches calls | Electron IPC |
| [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | [src/slices/projects/main/index.ts](../../../../../../src/slices/projects/main/index.ts) | Dispatches calls | Electron IPC |
| [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | [src/slices/scopes/main/index.ts](../../../../../../src/slices/scopes/main/index.ts) | Dispatches calls | Electron IPC |
