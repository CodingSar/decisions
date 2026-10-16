---
type: C4 Component
title: Decision store
status: stable
groma:
  id: decisions-store
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/decisions/store/index.ts
  technology: Markdown files
description: Reads/writes Decision files
---

One `.decisions/D<n>.md` per Decision with tiny frontmatter; allocates sequential IDs per Project.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/slices/decisions/store/index.ts](../../../../../../src/slices/decisions/store/index.ts) | [src/slices/decisions/model.ts](../../../../../../src/slices/decisions/model.ts) | Uses file format | import |
