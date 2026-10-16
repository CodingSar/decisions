---
type: C4 Component
title: Terminal
status: stable
groma:
  id: terminal
  parent: ui
  code:
    - scanner: react
      file: src/slices/runs/ui/Terminal.tsx
    - scanner: typescript
      file: src/slices/runs/ui/Terminal.tsx
      symbol: Terminal
  technology: xterm.js
description: Shows a Run's pty output
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/runs/ui/Terminal.tsx](../../../../../../src/slices/runs/ui/Terminal.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
