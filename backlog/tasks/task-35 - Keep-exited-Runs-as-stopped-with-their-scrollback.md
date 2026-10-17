---
id: TASK-35
title: Keep exited Runs as stopped with their scrollback
status: Done
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-16 21:20'
labels: []
dependencies:
  - TASK-32
ordinal: 39
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review U13. Exit code 0 removes the Run and disposes its terminal (src/slices/runs/main/index.ts), so /exit or a finished agent loses the scrollback and J on its Decisions does nothing. Keep the Run as stopped (dim dot, read-only scrollback) and remove it only on an explicit close.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A Run whose session exits stays in the list as stopped with its scrollback; terminal.feature covers it
<!-- AC:END -->
