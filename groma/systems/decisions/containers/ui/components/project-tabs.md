---
type: C4 Component
title: Project tabs
status: stable
groma:
  id: project-tabs
  parent: ui
  code:
    - scanner: react
      file: src/slices/projects/ui/Projects.tsx
    - scanner: typescript
      file: src/slices/projects/ui/Projects.tsx
      symbol: Projects
description: Project tab strip
---

Open/focus/close Project tabs, shows pending badges, and hosts the active Project's content.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/projects/ui/Projects.tsx](../../../../../../src/slices/projects/ui/Projects.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
