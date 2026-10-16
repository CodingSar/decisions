---
type: C4 Component
title: Pending tracker
status: stable
groma:
  id: use-pending
  parent: ui
  code:
    - scanner: typescript
      file: src/slices/decisions/ui/usePending.ts
      symbol: usePending
description: Tracks pending Decisions per Project
---

Hook that loads pending Decisions and refreshes on `decisions:changed` pushes.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/decisions/ui/usePending.ts](../../../../../../src/slices/decisions/ui/usePending.ts) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
