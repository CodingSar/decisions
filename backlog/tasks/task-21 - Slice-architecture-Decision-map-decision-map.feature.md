---
id: TASK-21
title: 'Slice: architecture - Decision map (decision-map.feature)'
status: Done
assignee: []
created_date: '2026-10-16 12:34'
updated_date: '2026-10-16 13:44'
labels: []
dependencies:
  - TASK-20
modified_files:
  - src/slices/architecture/model.ts
  - src/slices/architecture/index.ts
  - src/slices/architecture/main/index.ts
  - src/slices/architecture/store/groma.ts
  - src/slices/architecture/ui/DecisionMap.tsx
  - src/slices/architecture/ui/map.css
  - src/slices/architecture/spec/steps.ts
  - src/slices/decisions/model.ts
  - src/slices/decisions/index.ts
  - src/slices/decisions/main/index.ts
  - src/shell/main.ts
  - src/shell/ui/App.tsx
  - src/shell/ui/shell.css
  - playwright.config.ts
ordinal: 21
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mini map in right sidebar under terminal, modal zoom (Esc), drill-down, glow/tint rules, empty state. Own SVG render of groma/.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 decision-map.feature passes
<!-- AC:END -->
