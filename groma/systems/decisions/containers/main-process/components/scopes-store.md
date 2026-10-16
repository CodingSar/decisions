---
type: C4 Component
title: Scope store
status: stable
groma:
  id: scopes-store
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/scopes/store/index.ts
  technology: JSON file
description: Reads/writes Scope settings
---

Scope settings per Project in `.decisions/config.json`, merged with the seeded Scopes (ADR 0003).
