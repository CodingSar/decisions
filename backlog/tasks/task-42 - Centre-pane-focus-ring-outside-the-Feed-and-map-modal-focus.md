---
id: TASK-42
title: Centre pane focus ring outside the Feed and map modal focus
status: In Progress
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-16 21:30'
labels: []
dependencies:
  - TASK-32
ordinal: 46
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V15, V17. ⌘2 rings nothing on Review/History/Files or an empty Feed (no focus unit); dead .sidebar/.terminal selectors in shell.css. The map modal shows nothing for an element without Decisions and opening a row only switches view without highlighting D<n>.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ⌘2 shows the ring on every centre view; opening a Decision from the map highlights its row; decision-map.feature and work-across-projects.feature cover it
<!-- AC:END -->
