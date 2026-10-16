# Review fixes (resume here)

Goal: fix bugs and inconsistencies from the 2026-10-16 repo review. Writers run per area on disjoint files; tests run serially afterwards.

## Phase 1 (parallel)
- A harness: fake-agent unhandled rejection, client cleanup
- B git: path containment, detached HEAD, rename tokens, no credential prompt, commit msg, stale diff, labels/icons
- C files: .decisions guard, stale read/data loss, pending gate, write errors, watcher error, tree open state
- D runs: monotonic id, stop vs failed, terminal mount race, uncaught promises, hook dedupe
- E decisions: shortcuts in inputs, uncaught send/accept, advance() leak, usePending via useAll, mcp components bound
- H docs: mvp-status, v1-inspect, CLAUDE.md TODOs, GLOSSARY terms, task-3 notes, ADR candidates, biome dup

## Phase 2
- F architecture: one Groma reader, cycle guard, stale model, hover, empty nodes
- G shell: accent misuse, .term dup, hardcoded colors, registerGit once, App dedupe

## Status
Done 2026-10-16. All phases A-H applied, then three reader reviews; their 🔴/🟡 findings fixed (runs stop ordering + session token + terminal offset dedup, FilesView stale save, git branch list/switch/stale guards, DecisionMap reset/debounce, registerArchitecture in whenReady). Typecheck clean, Biome clean, full suite 108/108. Not committed.
