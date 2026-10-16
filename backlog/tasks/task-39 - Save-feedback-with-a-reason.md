---
id: TASK-39
title: Save feedback with a reason
status: To Do
assignee: []
created_date: '2026-10-16 20:27'
labels: []
dependencies:
  - TASK-32
ordinal: 43
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V8. Autosave gives no success feedback; 'Save failed' is muted, 3 s, without a reason (src/slices/files/ui/FilesView.tsx, files:write returns ok:false only). Return a reason, show the failure in error style until the next successful write, and a brief Saved state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A refused write shows why; a successful write shows Saved; edit-files.feature covers both
<!-- AC:END -->
