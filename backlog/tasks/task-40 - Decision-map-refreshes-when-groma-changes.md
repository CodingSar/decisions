---
id: TASK-40
title: Decision map refreshes when groma/ changes
status: Done
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-16 21:32'
labels: []
dependencies:
  - TASK-32
ordinal: 44
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review V10. useModel refetches only on decisions:changed (src/slices/architecture/ui/DecisionMap.tsx), so after the curate Run writes groma/ the map stays on its empty state until restart. Subscribe to file changes under groma/.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The map appears once the curate Run writes groma/ without a restart; decision-map.feature covers it
<!-- AC:END -->
