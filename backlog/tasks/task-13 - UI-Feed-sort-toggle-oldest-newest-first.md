---
id: TASK-13
title: 'UI: Feed sort toggle (oldest/newest first)'
status: Done
assignee: []
created_date: '2026-10-16 11:38'
updated_date: '2026-10-16 12:05'
labels: []
dependencies:
  - TASK-10
references:
  - app-shell
  - decision-feed
modified_files:
  - src/slices/decisions/spec/sort-feed.feature
  - src/slices/decisions/spec/steps.ts
  - playwright.config.ts
  - src/slices/decisions/ui/Feed.tsx
  - src/shell/ui/App.tsx
  - src/slices/decisions/ui/feed.css
ordinal: 13
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Arrow icon in the main header toggles order; tooltip names current order. Keys still act on the oldest pending card unless a card is focused.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scenario: toggling reverses card order
<!-- AC:END -->
