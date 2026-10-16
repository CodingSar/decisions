---
type: C4 Component
title: Decision model
status: stable
groma:
  id: decisions-domain
  parent: ui
  code:
    - scanner: typescript
      file: src/slices/decisions/model.ts
    - scanner: typescript
      file: src/slices/decisions/index.ts
description: Decision types, Verdict, file format
---

Decision and Verdict types, verdict reply text, and Markdown serialize/parse. Shared by renderer and main.
