---
id: TASK-11
title: 'UI: compact unfocused Feed cards and agent chevron'
status: Done
assignee: []
created_date: '2026-10-16 11:38'
updated_date: '2026-10-16 11:57'
labels: []
dependencies:
  - TASK-10
references:
  - decision-feed
modified_files:
  - src/slices/decisions/spec/steps.ts
  - src/slices/decisions/spec/take-decision.feature
  - src/slices/decisions/ui/Feed.tsx
  - src/slices/decisions/ui/feed.css
ordinal: 11
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mock shows only the focused card in full; others compact (question + muted options). Mock also shows agent as 'a › b'; spec asserts '>'. Update the spec step if chevron adopted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Unfocused cards render compact, focused card full
- [x] #2 Spec and UI agree on the agent separator
<!-- AC:END -->
