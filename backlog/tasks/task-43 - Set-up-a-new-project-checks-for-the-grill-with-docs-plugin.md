---
id: TASK-43
title: Set up a new project checks for the grill-with-docs plugin
status: Done
assignee: []
created_date: '2026-10-16 20:27'
updated_date: '2026-10-17 16:48'
labels: []
dependencies:
  - TASK-32
ordinal: 47
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UX review U3. 'Set up a new project' only starts a Run with /grill-with-docs; a missing plugin prints 'unknown command' with no explanation, and the card is styled as the primary action though 'open folder' is the common path. Design call (interview).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A missing plugin is explained before the Run starts; open-project.feature covers it
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done via setup-project.feature (plugin install failure explained in terminal); see docs/plans/2026-10-17-terminal-decisions-and-project-setup.md
<!-- SECTION:NOTES:END -->
