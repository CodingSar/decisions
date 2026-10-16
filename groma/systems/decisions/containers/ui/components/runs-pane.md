---
type: C4 Component
title: Runs pane
status: stable
groma:
  id: runs-pane
  parent: ui
  code:
    - scanner: react
      file: src/slices/runs/ui/RunsPane.tsx
    - scanner: typescript
      file: src/slices/runs/ui/RunsPane.tsx
description: Runs list and controls
---

Sidebar to create, select, start and stop Runs.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/runs/ui/RunsPane.tsx](../../../../../../src/slices/runs/ui/RunsPane.tsx) | [src/slices/runs/ui/Terminal.tsx](../../../../../../src/slices/runs/ui/Terminal.tsx) | Embeds terminal | React |
| [src/slices/runs/ui/RunsPane.tsx](../../../../../../src/slices/runs/ui/RunsPane.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
