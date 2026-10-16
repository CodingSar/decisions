---
type: C4 Component
title: App shell
status: stable
groma:
  id: app-shell
  parent: ui
  code:
    - scanner: react
      file: src/shell/ui/App.tsx
    - scanner: typescript
      file: src/shell/ui/App.tsx
      symbol: App
description: Top-level layout and view switching
---

Composes Project tabs, Feed/History views, Runs pane and Settings; handles global shortcuts and per-Project pending badges.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/projects/ui/Projects.tsx](../../../../../../src/slices/projects/ui/Projects.tsx) | Renders tabs | React |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/decisions/ui/Feed.tsx](../../../../../../src/slices/decisions/ui/Feed.tsx) | Renders Feed | React |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/decisions/ui/History.tsx](../../../../../../src/slices/decisions/ui/History.tsx) | Renders History | React |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/runs/ui/RunsPane.tsx](../../../../../../src/slices/runs/ui/RunsPane.tsx) | Renders Runs | React |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/scopes/ui/Settings.tsx](../../../../../../src/slices/scopes/ui/Settings.tsx) | Renders Settings | React |
| [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | [src/slices/decisions/ui/usePending.ts](../../../../../../src/slices/decisions/ui/usePending.ts) | Reads pending counts | React hook |
