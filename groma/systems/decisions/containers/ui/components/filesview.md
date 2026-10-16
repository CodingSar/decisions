---
type: C4 Component
title: FilesView
status: stable
groma:
  id: filesview
  parent: ui
  code:
    - scanner: react
      file: src/slices/files/ui/FilesView.tsx
    - scanner: typescript
      file: src/slices/files/ui/FilesView.tsx
      symbol: FilesView
---

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/files/ui/FilesView.tsx](../../../../../../src/slices/files/ui/FilesView.tsx) | [src/shell/ui/App.tsx](../../../../../../src/shell/ui/App.tsx) | Invokes supplied callback: onOpen | react |
