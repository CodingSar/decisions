---
id: TASK-27
title: 'Terminal: live per-Run terminals + flow control'
status: To Do
assignee: []
created_date: '2026-10-16 16:28'
labels: []
dependencies:
  - TASK-26
ordinal: 31
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Phase 2 of docs/plans/2026-10-16-terminal-modernization.md: one xterm per Run kept alive and re-parented on switch (no replay flash); renderer->main ack flow control with watermarks; 2 MB scrollback cap in main.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario 'Switching Runs keeps each terminal' passes
- [ ] #2 Scenario 'Fast output does not drop text' passes
<!-- AC:END -->
