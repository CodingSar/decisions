---
id: TASK-24
title: 'Decision map: dependency matrix view for dense levels'
status: To Do
assignee: []
created_date: '2026-10-16 16:03'
labels:
  - architecture
  - ui
dependencies:
  - TASK-21
ordinal: 24
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional third view: a Design Structure Matrix (rows/cols = elements of the current level, cell = arrow). Useful when a level has >15 elements and the Overview arrows get dense. See ADR 0008.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Matrix view toggle next to Overview and Interactions
- [ ] #2 Rows and columns follow the current level; cells show arrows and pending heat
- [ ] #3 Scenario in decision-map.feature
<!-- AC:END -->
