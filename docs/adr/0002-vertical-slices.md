# Vertical slice architecture

Code is organised by feature, not by technical layer, so one change touches one folder and agents load little context. Every slice has the same shape; a slice is imported only through its `index.ts`.

```
src/
  slices/<slice>/
    index.ts      public API (the only import point)
    model.ts      domain types and rules, no I/O
    main/         Electron main-process logic
    ui/           React components
    store/        persistence (.decisions/ files, config)
    spec/         .feature scenarios and their steps
  shell/          window, layout, hover focus, wiring of slices
  shared/         domain-free helpers: `testing/` (fixtures, fake agent) and `ui/` (Chevron, Glyph)
```

A slice has one entry per process: `index.ts` (renderer-safe: ui, model) and `main/index.ts` (Electron main). Never import Electron from `index.ts`, or it lands in the renderer bundle.

Slices: `projects`, `runs` (includes the terminal), `decisions`, `scopes`, `files`, `git`, `architecture`, `agent-runtimes` (one subfolder per adapter, plus `fake/`). `shared/` knows no domain terms. Slices never import each other's internals; cross-slice needs go through `index.ts` or events. Create only the folders a slice needs (parsimony).
