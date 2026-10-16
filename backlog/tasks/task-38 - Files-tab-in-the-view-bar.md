---
id: TASK-38
title: Files tab in the view bar
status: In Progress
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-16 21:20'
labels: []
dependencies:
  - TASK-32
ordinal: 42
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V7. The view bar has Feed/Review/History only (src/shell/ui/App.tsx VIEWS) though the Files view exists; no tab, no shortcut (mock: Files ⌘⇧E), and F/R/H lose the open file. Add the tab, keep the open path across switches.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Files tab with tooltip and shortcut switches to the last open file; browse-files.feature covers it
<!-- AC:END -->
