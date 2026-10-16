---
id: TASK-14
title: 'UI: Recent projects list on New project'
status: Done
assignee: []
created_date: '2026-10-16 11:38'
updated_date: '2026-10-16 12:05'
labels: []
dependencies:
  - TASK-10
references:
  - project-tabs
  - projects-ipc
  - app-shell
modified_files:
  - src/slices/projects/spec/recent-projects.feature
  - src/slices/projects/spec/steps.ts
  - playwright.config.ts
  - src/slices/projects/model.ts
  - src/slices/projects/main/index.ts
  - src/slices/projects/ui/Projects.tsx
  - src/shell/ui/App.tsx
  - src/shell/ui/shell.css
ordinal: 14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
List recently opened Projects with path and pending badge; click opens it. Needs persisted recent list.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scenario: closed Project appears under Recent and reopens on click
<!-- AC:END -->
