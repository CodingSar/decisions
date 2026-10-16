import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { type IMarker, Terminal as Xterm } from '@xterm/xterm'
import type { Run } from '../model'
import { font, hasWebgl, OPTIONS, theme } from './look'
import { watchSignals } from './signals'

// One xterm per Run, kept alive for the Run's lifetime and re-parented on switch: no replay, no flash.
export interface Live {
  term: Xterm
  fit: FitAddon
  search: SearchAddon
  el: HTMLDivElement
  renderer: 'webgl' | 'dom'
  /** Chunks that arrived while the snapshot loads. */
  buffer?: Chunk[]
  /** Decision id -> the line it was raised on; null when raised on the alternate screen (TUI), where only a chip can show it. */
  marks: Map<string, IMarker | null>
}
type Chunk = { id: string; data: string; offset: number }
type Mark = { id: string; decision: string }

const live = new Map<string, Live>()
// Marks for Runs whose terminal does not exist yet; placed after the first snapshot.
const pending = new Map<string, string[]>()
let created = 0

declare global {
  interface Window {
    /** Test hook. */
    terminals: {
      created(): number
      marks(id: string): { decision: string; line: number | null }[]
      viewport(id: string): { y: number; rows: number } | undefined
    }
  }
}
window.terminals = {
  created: () => created,
  marks: (id) =>
    [...(live.get(id)?.marks ?? [])].map(([decision, m]) => ({ decision, line: m?.line ?? null })),
  viewport: (id) => {
    const t = live.get(id)
    return t && { y: t.term.buffer.active.viewportY, rows: t.term.rows }
  },
}

const AMBER = '#e5b567'

// An amber dot in the gutter and a mark in the overview ruler on the line the Decision was raised.
function mark(id: string, t: Live, decision: string) {
  if (t.term.buffer.active.type === 'alternate') {
    t.marks.set(decision, null)
  } else {
    const marker = t.term.registerMarker(0)
    t.marks.set(decision, marker)
    t.term
      .registerDecoration({
        marker,
        x: 0,
        width: 1,
        overviewRulerOptions: { color: AMBER, position: 'left' },
      })
      ?.onRender((el) => {
        el.classList.add('dmark')
        el.title = decision
      })
  }
  window.dispatchEvent(new CustomEvent('terminal:marks', { detail: id }))
}

/** The latest Decision that could only be shown as a chip (raised on the alternate screen). */
export const chipOf = (id: string) =>
  [...(live.get(id)?.marks ?? [])].findLast(([, m]) => m === null)?.[0]

/** Scrolls the Run's terminal to where the Decision was raised. */
export function showDecision(id: string, decision: string) {
  const t = live.get(id)
  const m = t?.marks.get(decision)
  if (t && m && !m.isDisposed) t.term.scrollToLine(m.line)
}

// The system clipboard lives in main (Electron `clipboard`), for OSC 52 and the copy/paste keys alike.
const clipboard = {
  readText: () => window.api.invoke('clipboard:read') as Promise<string>,
  writeText: (_sel: unknown, text: string) =>
    window.api.invoke('clipboard:write', text) as Promise<void>,
}

// Keys the app handles itself (search, hide, pane focus) and the ones a TUI needs verbatim.
function keys(term: Xterm, id: string) {
  term.attachCustomKeyEventHandler((e) => {
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    const down = e.type === 'keydown'
    // Claude Code: Shift+Enter is a newline inside the prompt.
    if (e.key === 'Enter' && e.shiftKey && !mod && !e.altKey) {
      if (down) {
        e.preventDefault()
        window.api.invoke('runs:input', id, '\x1b\r').catch(() => {})
      }
      return false
    }
    if (!mod || e.altKey) return true
    if (e.shiftKey && k === 'c') {
      if (down && term.hasSelection()) clipboard.writeText(undefined, term.getSelection())
      return false
    }
    if (e.shiftKey && k === 'v') {
      if (down) clipboard.readText().then((t) => t && term.paste(t))
      return false
    }
    // Let the shell see these (focus.ts, App.tsx).
    return !(!e.shiftKey && (k === 'f' || k === 'j' || /^[123]$/.test(k)))
  })
}

// Each write is acknowledged so main can pause a Run that outruns the renderer.
const write = (id: string, t: Live, data: string) =>
  t.term.write(data, () => window.api.invoke('runs:ack', id, data.length).catch(() => {}))

let subscribed = false
function subscribe() {
  if (subscribed) return
  subscribed = true
  window.api.on('runs:data', (m: Chunk) => {
    const t = live.get(m.id)
    if (!t) return
    if (t.buffer) t.buffer.push(m)
    else write(m.id, t, m.data)
  })
  window.api.on('runs:changed', (runs: Run[]) => {
    for (const id of live.keys()) if (!runs.some((r) => r.id === id)) dispose(id)
  })
  window.api.on('runs:mark', ({ id, decision }: Mark) => {
    const t = live.get(id)
    if (t && !t.buffer) mark(id, t, decision)
    else pending.set(id, [...(pending.get(id) ?? []), decision])
  })
}

// WebGL when the GPU allows it, the DOM renderer otherwise (and after a context loss).
function render(t: Live) {
  if (!hasWebgl()) return
  try {
    const webgl = new WebglAddon()
    webgl.onContextLoss(() => {
      webgl.dispose()
      t.renderer = 'dom'
    })
    t.term.loadAddon(webgl)
    t.renderer = 'webgl'
  } catch {}
}

function create(id: string, host: HTMLElement): Live {
  const el = document.createElement('div')
  el.className = 'term-live'
  host.append(el)
  const term = new Xterm({ ...OPTIONS, fontFamily: font(), theme: theme() })
  const fit = new FitAddon()
  term.loadAddon(fit)
  const search = new SearchAddon()
  term.loadAddon(search)
  term.loadAddon(new Unicode11Addon())
  term.unicode.activeVersion = '11'
  term.loadAddon(new WebLinksAddon((_e, uri) => window.api.invoke('shell:open', uri)))
  term.loadAddon(new ClipboardAddon(undefined, clipboard))
  keys(term, id)
  term.open(el)
  const t: Live = { term, fit, search, el, renderer: 'dom', buffer: [], marks: new Map() }
  render(t)
  created++
  term.onData((d) => {
    window.api.invoke('runs:input', id, d).catch(() => {})
  })
  watchSignals(term, (s) => window.api.invoke('runs:signal', id, s).catch(() => {}))
  // Watching returns the scrollback so far and starts the ack count in main.
  window.api
    .invoke('runs:watch', id)
    .then((s) => {
      const { text, length } = s as { text: string; length: number }
      term.write(text)
      // Chunks already inside the snapshot are skipped (or trimmed).
      for (const c of t.buffer ?? []) {
        const skip = length - c.offset
        if (skip < c.data.length) write(id, t, skip > 0 ? c.data.slice(skip) : c.data)
      }
    })
    .catch(() => {})
    .finally(() => {
      t.buffer = undefined
      // Decisions raised before the terminal existed land at the end of the replayed scrollback.
      for (const d of pending.get(id) ?? []) mark(id, t, d)
      pending.delete(id)
    })
  return t
}

/** Shows the Run's terminal in `host`, creating it on first show. */
export function attach(id: string, host: HTMLElement): Live {
  subscribe()
  let t = live.get(id)
  if (!t) {
    t = create(id, host)
    live.set(id, t)
  } else host.append(t.el)
  return t
}

/** Takes the Run's terminal out of the DOM; it keeps its buffer. */
export const detach = (id: string) => live.get(id)?.el.remove()

function dispose(id: string) {
  const t = live.get(id)
  if (!t) return
  live.delete(id)
  pending.delete(id)
  t.term.dispose()
  t.el.remove()
  window.api.invoke('runs:unwatch', id).catch(() => {})
}
