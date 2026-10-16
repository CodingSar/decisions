---
type: C4 Container
title: Main process
status: draft
groma:
  id: main-process
  parent: decisions
  technology: Electron main, Node.js
description: Owns window, Runs, MCP endpoint and Decision files
---

Creates the window, registers one IPC handler group per slice, hosts Agent Runtime adapters and the loopback MCP server, and reads/writes `.decisions/` files.
