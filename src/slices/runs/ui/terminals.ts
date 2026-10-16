import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal as Xterm } from '@xterm/xterm'
import type { Run } from '../model'
import { font, hasWebgl, OPTIONS, theme } from './look'
import { watchSignals } from './signals'

// One xterm per Run, kept alive for the Run's lifetime and re-parented on switch: no replay, no flash.
export interface Live {
  term: Xterm
  fit: FitAddon
  el: HTMLDivElement
  renderer: 'webgl' | 'dom'
  /** Chunks that arrived while the snapshot loads. */
  buffer?: Chunk[]
}
type Chunk = { id: string; data: string; offset: number }

const live = new Map<string, Live>()
let created = 0

declare global {
  interface Window {
    /** Test hook. */
    terminals: { created(): number }
  }
}
window.terminals = { created: () => created }

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
  term.loadAddon(new Unicode11Addon())
  term.unicode.activeVersion = '11'
  term.open(el)
  const t: Live = { term, fit, el, renderer: 'dom', buffer: [] }
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
  t.term.dispose()
  t.el.remove()
  window.api.invoke('runs:unwatch', id).catch(() => {})
}
