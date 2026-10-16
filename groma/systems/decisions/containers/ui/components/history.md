---
type: C4 Component
title: History
status: stable
groma:
  id: history
  parent: ui
  code:
    - scanner: react
      file: src/slices/decisions/ui/History.tsx
    - scanner: typescript
      file: src/slices/decisions/ui/History.tsx
      symbol: History
description: Past Decisions, overturnable
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/decisions/ui/History.tsx](../../../../../../src/slices/decisions/ui/History.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
