---
id: TASK-37
title: Hover focus must not interrupt typing
status: To Do
assignee: []
created_date: '2026-10-16 20:27'
labels: []
dependencies:
  - TASK-32
ordinal: 41
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V6. Hover focus moves after 150 ms dwell regardless of typing (src/shell/ui/focus.ts), so typing in the terminal while the mouse rests on a card turns keystrokes into Verdicts. Design call (interview): suspend hover focus for ~1 s after a keystroke, or require pointer movement beyond a threshold.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typing in the terminal with the mouse resting on a card sends no Verdict; work-across-projects.feature covers it
<!-- AC:END -->
