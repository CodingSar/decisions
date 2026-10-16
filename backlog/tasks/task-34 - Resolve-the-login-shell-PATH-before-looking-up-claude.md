---
id: TASK-34
title: Resolve the login-shell PATH before looking up claude
status: To Do
assignee: []
created_date: '2026-10-16 20:27'
labels: []
dependencies:
  - TASK-32
ordinal: 38
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review U1 (docs/plans/2026-10-16-ux-review.md). A Dock-launched macOS app lacks the login-shell PATH, so an installed claude CLI still reads 'not found'. Resolve the shell PATH once at startup (shell-env style or spawn $SHELL -ilc) before onPath/spawn in src/slices/agent-runtimes/claude-code/index.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Run starts with claude installed via nvm or Homebrew when the app is launched from the Dock; claude-code.feature covers the PATH lookup
<!-- AC:END -->
