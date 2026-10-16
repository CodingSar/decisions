---
id: TASK-10
title: 'UI: visual pass vs mock (Feed, Review, History, sidebar, terminal, Settings)'
status: Done
assignee: []
created_date: '2026-10-16 11:38'
updated_date: '2026-10-16 11:55'
labels: []
dependencies: []
modified_files:
  - src/shell/main.ts
  - src/shell/ui/shell.css
  - src/shell/spec/work-across-projects.feature
  - src/shell/spec/steps.ts
  - src/slices/decisions/ui/Row.tsx
  - src/slices/decisions/ui/Review.tsx
  - src/slices/decisions/ui/History.tsx
  - src/slices/decisions/ui/feed.css
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seed a project and screenshot each screen against docs/mock/*.dc.html; fix spacing/colour gaps. Styling only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Screenshots of Feed, Review, History, Settings match the mock; gaps fixed
- [x] #2 npm test green
- [x] #3 Divider between Feed and terminal is visible again, in --line (same colour as the other dividers), never accent
<!-- AC:END -->
