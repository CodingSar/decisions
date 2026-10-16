# TASK-17 browse files

Decisions: Monaco read-only now (TASK-18 makes it editable); `react-markdown` + `remark-gfm`; `ignore` pkg for root `.gitignore`, always hide `.git`; `fs.watch` recursive; no chokidar. UI per `docs/mock/Files.dc.html`.

Files: `src/slices/files/{index.ts,model.ts,main/index.ts,ui/{FileTree,FilesView}.tsx,spec/steps.ts}`, `src/shell/main.ts` (register), `src/shell/ui/App.tsx` (Files section under Runs, Files view tab), `playwright.config.ts` (add feature).

Phases (each: failing scenario -> pass; `npm run typecheck`, `npm run lint`, `npm test -- browse-files.feature`):
1. Tree under Runs, respects .gitignore (`files:list` IPC, FileTree).
2. Open .md rendered + source toggle (`files:read`, FilesView tab, react-markdown).
3. Relative link opens file; external link -> `shell.openExternal` (test hook: record URL when `DECISIONS_RUNTIME` set).
4. Watcher: `fs.watch` -> `files:changed` -> tree refresh.
5. `.decisions/` read-only: Monaco read-only for code; no edit-anyway icon.
