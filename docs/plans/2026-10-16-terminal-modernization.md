# Terminal modernization

Status: approved 2026-10-16, not started. Decisions below are final (TUI kept, JetBrains Mono, phase order 1-5).

## Running this plan unattended
- One phase per commit. Per phase: write the failing scenario, implement, `npm run typecheck`, `npm test -- start-run.feature` (or `terminal.feature`), then `npm run lint`. Full `npm test` before the last commit.
- Create one Backlog task per phase (`backlog task create`), ordinals 30-34, each `--dep` on the previous. Run `groma agent-instructions backlog` before changing files for a task.
- Stop and write the failure into this file (section "Current failure") if a phase cannot pass; do not skip to the next.
- Library APIs: check Context7 for xterm addon options before use; versions in the phases are from 2026-10-16.

Goal: the Run terminal feels like Ghostty (rendering, font, theme, padding, cursor) and borrows Warp's structure (status header, markers, jump-to) while staying one xterm.js pane that is wired into the app's Run / Decision model.

## Where we are

- `src/slices/runs/ui/Terminal.tsx`: bare `@xterm/xterm` 6 + fit. DOM renderer, xterm default theme (pure black, default font), no cursor config, no unicode11, no links, no search, no clipboard.
- One `Xterm` per mount: switching Runs disposes it and replays the full raw scrollback from main (`runs:output`). Flash + O(n) on every switch.
- Main keeps scrollback as an unbounded concatenated string (`runs/main/index.ts:22-33`). No flow control: a chatty Run can outrun the renderer (xterm drops past 50 MB).
- Output is opaque bytes. Nothing reads OSC title, bell, progress or Claude Code's OSC 7501 status. `Run.status` is only idle/running/stopped/failed; "waiting for the human" is invisible outside the terminal.
- Decisions carry no Run link (`decisions/main/index.ts:104`), no jump between Feed and terminal.
- Shortcuts in tooltips (N, S, X) are not implemented (`App.tsx:68-85` has no handlers); the mock shows ⌘J hide.
- Claude Code specifics: Shift+Enter needs `ESC CR`; emoji / nerd glyph widths need unicode11; fullscreen mode (default for new users since 2026-05) draws on the alt screen, so xterm scrollback and search see nothing from the conversation.

## Ideas, ranked

1. **Ghostty look**: WebGL renderer (DOM fallback on context loss), bundled mono font, theme from `shell.css` tokens, 16 px padding kept, bar cursor + blink, `cursorInactiveStyle: 'outline'`, smooth scroll, thin overview-ruler scrollbar, unfocused dim.
2. **Live terminals**: one `Xterm` per Run kept in memory, DOM re-parented on switch. No replay, no flash. Renderer→main flow control with watermarks. Scrollback cap in main.
3. **Signals into the Run model**: parse OSC 0/2 (title), 7501 (working / waiting / done), 9;4 (progress), BEL / 9 / 777 / 99 (notify). Run gets `activity` and `progress`; sidebar dot and header reflect it; OS notification when the window is unfocused and a Run waits for input.
4. **Keys and tools**: Shift+Enter, ⌘F search overlay, clickable links, OSC 52 clipboard, ⌘J hide, working N/S/X.
5. **Decision markers**: amber marker + overview-ruler mark where a `request_decision` landed; Feed card jumps to it. Degrades to a header chip in alt-screen mode.
6. **Parked**: Warp-style blocks via `claude -p --output-format stream-json` (a chat UI instead of a TUI). Big change, separate design. Splits / tabs inside the pane: RunList already covers it.

## Decisions (defaults; change before Phase 1)

- Font: `@fontsource-variable/jetbrains-mono` bundled, fallback `IBM Plex Mono, monospace`. Ligatures via WebGL (no ligatures addon).
- Renderer: `@xterm/addon-webgl` 0.19, probe WebGL2 first, `onContextLoss` → dispose addon → DOM.
- OSC parsing lives in the renderer (`parser.registerOscHandler`), forwarded to main as `runs:signal`. Possible since Phase 2 keeps every Run's xterm alive.
- Keep the TUI. stream-json stays parked.

## Phases

Each phase: one failing scenario in `src/slices/runs/spec/start-run.feature` (or a new `terminal.feature` listed in `playwright.config.ts`), make it pass, `npm run typecheck && npm test -- <feature>`.

### Phase 1: look
Files: `Terminal.tsx`, `shell.css`, `package.json`.
- Add `@xterm/addon-webgl`, `@xterm/addon-unicode11`, `@fontsource-variable/jetbrains-mono`.
- `Xterm` options: `fontFamily`, `fontSize 12.5`, `lineHeight 1.4`, `cursorStyle 'bar'`, `cursorBlink`, `cursorInactiveStyle 'outline'`, `smoothScrollDuration 80`, `scrollback 5000`, `minimumContrastRatio 4.5`, `allowProposedApi`, `scrollbar: {width: 8}` for the overview ruler, `theme` built from CSS custom properties (`getComputedStyle(document.documentElement)`), ANSI 16 picked to the warm palette.
- Load webgl after `open()`, fallback as above; `term.unicode.activeVersion = '11'`.
- `.term[data-readonly]` and unfocused pane: `opacity: .85` (Ghostty `unfocused-split-opacity`), `.xterm .xterm-viewport` scrollbar styled like the app's.
- Verify: scenario "Terminal uses the app theme and font": computed `background-color` of `.xterm-screen`'s host equals `--deep`, `font-family` of `.xterm` starts with `JetBrains Mono`, `.term-host[data-renderer]` is `webgl` or `dom`.

### Phase 2: live terminals + flow control
Files: `Terminal.tsx`, new `runs/ui/terminals.ts` (Xterm registry), `runs/main/index.ts`, `runs/model.ts`.
- Registry: `Map<runId, {term, fit, webgl}>` created on first show, disposed on `runs:changed` when the Run disappears. `Terminal` only attaches/detaches the element and refits.
- Drop `runs:output` replay for already-created terms; keep it for first show.
- Flow control: main counts unacked bytes per Run; renderer calls `term.write(data, () => invoke('runs:ack', id, n))`; main pauses the pty above 100 kB and resumes below 10 kB (xterm flow-control guide). `AgentSession` gains `pause()/resume()` (no-op in fake).
- Scrollback cap in main: keep the last 2 MB per Run.
- Verify: scenario "Switching Runs keeps each terminal": start R1 and R2, type in R1, switch to R2 and back, R1 text still there and no `runs:output` round trip (assert via a counter exposed on `window` in test builds, or by timing < 50 ms). Scenario "Fast output does not drop text": fake adapter emits 1 MB with a sentinel at the end; sentinel visible.

### Phase 3: signals
Files: `runs/model.ts`, `runs/main/index.ts`, `Terminal.tsx`, `RunsPane.tsx`, `shell.css`, `agent-runtimes/fake/index.ts`, `shell/main.ts` (Notification).
- `Run` gains `activity?: 'working' | 'waiting' | 'done'`, `progress?: number`, `title?: string`, `renamed: boolean`.
- Renderer handlers: `registerOscHandler(0|2)` → title; `7501` → activity; `9` with `4;` prefix → progress (or `@xterm/addon-progress`); `9` / `777` / `99` otherwise plus `onBell` → notify. All forward `runs:signal {id, kind, value}`.
- Main: update Run, push `runs:changed`; on `notify` while `!win.isFocused()` show an Electron `Notification` titled with the Run name, click focuses the window and selects the Run. Title sets the Run name until the human renames.
- UI: dot states (green pulse working, amber waiting, grey done), 2 px progress bar under `.term-head`, header chip "waiting" with tooltip.
- Verify: fake adapter prints `ESC]7501;waiting BEL` on a `wait` command; scenario "Run shows waiting state" asserts the sidebar button name `R1 · waiting`. Scenario "Title names the Run" with `ESC]0;Fix tests BEL`.

### Phase 4: keys and tools
Files: `Terminal.tsx`, `App.tsx`, `shell/main.ts` (`shell.openExternal` IPC), `RunsPane.tsx`, new `runs/ui/Search.tsx`.
- `attachCustomKeyEventHandler`: Shift+Enter → write `\x1b\r`; ⌘/Ctrl+F opens search; ⌘J hides the pane; ⌘⇧C/V copy and paste; let ⌘1/2/3 through to `focus.ts`.
- `@xterm/addon-search` with a small overlay in `.term-head` (input + count + up/down icons, Esc closes). `@xterm/addon-web-links` opening through main. `@xterm/addon-clipboard` with a provider backed by Electron `clipboard`.
- N / S / X on the Workspace key handler, guarded to the terminal pane focus unit (xterm textarea is excluded, so only when the header or list is focused). Align tooltips with what works.
- Verify: scenario "Shift+Enter inserts a newline": fake adapter echoes input; `\x1b\r` received. Scenario "Find in terminal": ⌘F, type text, match count visible.

### Phase 5: Decision markers
Files: `decisions/main/index.ts`, `runs/main/index.ts`, `Terminal.tsx`, `decisions/ui/Feed.tsx`, `decisions/model.ts`.
- `request(req, runId)` emits `runs:mark {id: runId, decision: 'D7'}`; renderer registers a marker at the cursor, decoration with amber `overviewRulerOptions` and a gutter dot. On alt screen (`term.buffer.active.type === 'alternate'`) store only the chip.
- Decision gets a `run` field (frontmatter) so the Feed card shows a terminal icon "Show in Run (J)" that selects the Run and `scrollToLine(marker.line)`.
- Verify: scenario "Jump from a Decision to its Run": two Runs, Decision from R1, click the icon, R1 selected and the marker line in view (assert `term.buffer.active.viewportY` via a test hook, or the chip text).

## Order and why
1 and 2 first: everything visual and the registry are prerequisites for 3 (handlers need live terms). 4 is independent after 1. 5 depends on 3's IPC shape. Each phase ships alone.

## Risks
- WebGL on Linux with software GL: probe and fall back; keep DOM path tested (set `DECISIONS_RENDERER=dom` in test env).
- Claude Code fullscreen mode: no scrollback, search and markers degrade. Document; optionally spawn with `CLAUDE_CODE_NO_FLICKER=0` to keep classic mode until markers matter more than flicker.
- OSC 7501 spec unpublished; parse `working|waiting|done` leniently, ignore unknown.
