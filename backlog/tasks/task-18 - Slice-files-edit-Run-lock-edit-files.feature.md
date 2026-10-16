---
id: TASK-18
title: 'Slice: files - edit + Run lock (edit-files.feature)'
status: Done
assignee: []
created_date: '2026-10-16 12:34'
updated_date: '2026-10-16 13:19'
labels: []
dependencies:
  - TASK-17
references:
  - filesview
modified_files:
  - playwright.config.ts
  - src/shell/ui/App.tsx
  - src/shell/ui/shell.css
  - src/slices/files/main/index.ts
  - src/slices/files/spec/edit-files.feature
  - src/slices/files/spec/steps.ts
  - src/slices/files/ui/CodeView.tsx
  - src/slices/files/ui/FilesView.tsx
ordinal: 18
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Monaco editing, save, unsaved dot, Project-wide read-only while a Run is active, edit-anyway.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 edit-files.feature passes
<!-- AC:END -->
