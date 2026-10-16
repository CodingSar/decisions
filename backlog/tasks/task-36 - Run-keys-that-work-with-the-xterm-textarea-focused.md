---
id: TASK-36
title: Run keys that work with the xterm textarea focused
status: To Do
assignee: []
created_date: '2026-10-16 20:27'
labels: []
dependencies:
  - TASK-32
ordinal: 40
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V5. Hover focus puts focus on .xterm-helper-textarea, which the shell key guard treats as a text field, so N/S/X advertised in the terminal tooltips do nothing with the mouse over the terminal. Design call (interview): modifier keys (⌘N/⌘S/⌘X) or plain letters only while the Run is not live. Tooltips must match.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The keys in the terminal header tooltips fire with the mouse resting over the terminal; terminal.feature covers it
<!-- AC:END -->
