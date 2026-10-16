---
type: C4 Container
title: Renderer
status: stable
groma:
  id: ui
  parent: decisions
  technology: React, TypeScript, xterm
description: 'Renderer: tabs, Feed, History, Runs, Settings'
---

Electron renderer. Shows Project tabs, the Decision Feed and History, the Runs sidebar with terminal, and Scope settings. Talks to the main process only through the IPC bridge.
