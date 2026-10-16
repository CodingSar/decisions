---
id: TASK-41
title: 'Comment box: leaving it resumes keys and timers'
status: In Progress
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-16 21:12'
labels: []
dependencies:
  - TASK-32
ordinal: 45
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review U7. While commenting the Feed key handler is off and decisions:working pauses all timers; Esc is handled on the input only. If focus leaves the input (click elsewhere, ⌘1) L/D/Esc are dead and timers stay paused until the user finds the input again. Cancel an empty draft on blur, keep Esc global while commenting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Leaving an empty comment box resumes Verdict keys and timers; auto-resolve.feature covers it
<!-- AC:END -->
