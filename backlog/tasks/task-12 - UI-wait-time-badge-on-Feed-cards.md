---
id: TASK-12
title: 'UI: wait-time badge on Feed cards'
status: Done
assignee: []
created_date: '2026-10-16 11:38'
updated_date: '2026-10-16 12:01'
labels: []
dependencies:
  - TASK-10
references:
  - decision-feed
modified_files:
  - src/slices/decisions/spec/take-decision.feature
  - src/slices/decisions/spec/steps.ts
  - src/slices/decisions/model.ts
  - src/slices/decisions/main/index.ts
  - src/slices/decisions/ui/Feed.tsx
  - src/slices/decisions/ui/feed.css
ordinal: 12
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Amber clock + elapsed time (e.g. 4m) while the agent is blocked on a Decision. Needs the request time from the Decision/Run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scenario: pending card shows time waited, updates as time passes
<!-- AC:END -->
