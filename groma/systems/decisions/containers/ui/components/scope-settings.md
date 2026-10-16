---
type: C4 Component
title: Scope settings
status: stable
groma:
  id: scope-settings
  parent: ui
  code:
    - scanner: react
      file: src/slices/scopes/ui/Settings.tsx
    - scanner: typescript
      file: src/slices/scopes/ui/Settings.tsx
      symbol: Settings
description: Decision Scope settings modal
---

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/scopes/ui/Settings.tsx](../../../../../../src/slices/scopes/ui/Settings.tsx) | [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | Invokes supplied callback: onClose | react |

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/scopes/ui/Settings.tsx](../../../../../../src/slices/scopes/ui/Settings.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
