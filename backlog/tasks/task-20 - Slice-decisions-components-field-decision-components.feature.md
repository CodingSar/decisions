---
id: TASK-20
title: 'Slice: decisions - components field (decision-components.feature)'
status: Done
assignee: []
created_date: '2026-10-16 12:34'
updated_date: '2026-10-16 13:33'
labels: []
dependencies: []
references:
  - decisions-domain
  - decision-mcp-server
modified_files:
  - src/slices/agent-runtimes/model.ts
  - src/slices/agent-runtimes/mcp.ts
  - src/slices/decisions/model.ts
  - src/slices/decisions/store/groma.ts
  - src/slices/decisions/main/index.ts
  - src/shell/main.ts
  - src/shared/testing/fake-agent.ts
  - src/slices/decisions/spec/steps.ts
  - playwright.config.ts
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optional components on request_decision and D-file frontmatter; tool lists ids from groma/; overturn copies. Needs a spike on parsing groma/ (JSON/library vs Markdown).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 decision-components.feature passes
<!-- AC:END -->
