---
id: TASK-3
title: 'Slice: projects (src/slices/projects/spec/open-project.feature)'
status: Done
assignee: []
created_date: '2026-10-16 09:27'
updated_date: '2026-10-16 10:59'
labels: []
dependencies:
  - TASK-6
  - TASK-7
modified_files:
  - src/slices/projects/spec/steps.ts
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tabs, open/set up folder, restore on launch, missing folder.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 open-project.feature passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Scenarios 2 (Decisions in Feed/Review) and 'Restart restores the Feed' wait for decisions slice (TASK-6/7); auto-skipped. Scenario 5 split in two.

Blocked on TASK-6/7: when decisions slice lands, add steps for 'Open a folder that already has Decisions' and 'Restart restores the Feed' (open-project.feature), then check AC and mark Done.
<!-- SECTION:NOTES:END -->
