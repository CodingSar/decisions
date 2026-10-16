---
type: C4 Component
title: Agent runtime contract
status: stable
groma:
  id: agent-runtime-contract
  parent: main-process
  code:
    - scanner: typescript
      file: src/slices/agent-runtimes/index.ts
    - scanner: typescript
      file: src/slices/agent-runtimes/model.ts
description: Agent Runtime and Decision request types
---

Renderer-safe types: AgentRuntime, AgentSession, StartOptions and DecisionRequest.
