---
type: Groma Project
title: decisions
groma:
  profile: architecture
description: Local-first desktop IDE where a human takes the Decisions autonomous coding agents raise mid-run.
---

Electron app. The human opens Projects (folders), starts agent Runs in a terminal, and answers Decisions agents raise through an MCP tool. Verdicts are saved as Markdown in the Project's `.decisions/` folder and returned to the waiting agent. Code is organised in vertical slices (ADR 0002).
