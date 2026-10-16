---
id: TASK-33
title: Fix flaky Feed key-press scenarios
status: Done
assignee: []
created_date: '2026-10-16 17:04'
updated_date: '2026-10-16 20:52'
labels: []
dependencies: []
ordinal: 37
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
take-decision.feature, auto-resolve.feature and the shell 'Hover focuses after 150 ms' scenario fail in roughly 5% of runs when run in sequence (a key pressed, or the mouse resting, right after a card appears does nothing; all pass in isolation). Reproduces on f8535ae, before the terminal work. Suspects: the Feed keydown listener attaches in a passive effect after the card is visible; hover focus lands late under load. Reproduce with 'npx playwright test -g "Take a Decision|Hover focuses" --repeat-each 3', instrument document.activeElement, fix the root cause, keep the regression scenario.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Both features pass 10 repeated runs
<!-- AC:END -->
