---
type: C4 Component
title: Projects handlers
status: stable
groma:
  id: projects-ipc
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/projects/main/index.ts
      symbol: registerProjects
description: Tracks open Project tabs
---

Persists open Project folders and the active one in app data, serves the native folder picker, creates `.decisions/` on open, and triggers the setup Run for new Projects.
