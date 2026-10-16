---
type: C4 Component
title: Decision feed
status: stable
groma:
  id: decision-feed
  parent: ui
  code:
    - scanner: react
      file: src/slices/decisions/ui/Feed.tsx
    - scanner: typescript
      file: src/slices/decisions/ui/Feed.tsx
      symbol: Feed
description: Pending Decisions for Verdicts
---

Cards for pending Decisions, oldest first, with keyboard Verdicts (like, option, dislike, comment).

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/decisions/ui/Feed.tsx](../../../../../../src/slices/decisions/ui/Feed.tsx) | [src/slices/decisions/model.ts](../../../../../../src/slices/decisions/model.ts) | Uses Decision types | import |
| [src/slices/decisions/ui/Feed.tsx](../../../../../../src/slices/decisions/ui/Feed.tsx) | [src/shell/preload.ts](../../../../../../src/shell/preload.ts) | Calls main process | Electron IPC |
