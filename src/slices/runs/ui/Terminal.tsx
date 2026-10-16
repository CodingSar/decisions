import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal as Xterm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import { font, hasWebgl, OPTIONS, theme } from './look'

// WebGL when the GPU allows it, the DOM renderer otherwise (and after a context loss).
function render(term: Xterm, host: HTMLElement) {
  host.dataset.renderer = 'dom'
  if (!hasWebgl()) return
  try {
    const webgl = new WebglAddon()
    webgl.onContextLoss(() => {
      webgl.dispose()
      host.dataset.renderer = 'dom'
    })
    term.loadAddon(webgl)
    host.dataset.renderer = 'webgl'
  } catch {}
}

export function Terminal({ runId, live }: { runId: string; live: boolean }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = el.current as HTMLDivElement
    const term = new Xterm({ ...OPTIONS, fontFamily: font(), theme: theme(), disableStdin: !live })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new Unicode11Addon())
    term.unicode.activeVersion = '11'
    term.open(host)
    render(term, host)
    // Fit on the unpadded host, once per frame; always tell the PTY, so the TUI redraws at the real size.
    let frame = 0
    const refit = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        fit.fit()
        window.api.invoke('runs:resize', runId, term.cols, term.rows)
      })
    }
    const ro = new ResizeObserver(refit)
    ro.observe(host)
    refit()
    let disposed = false
    document.fonts.ready.then(() => {
      if (!disposed) refit()
    })
    // Subscribe first and buffer, so output between snapshot and subscription is neither lost nor doubled.
    type Chunk = { id: string; data: string; offset: number }
    let buffer: Chunk[] | undefined = []
    const off = window.api.on('runs:data', (m: Chunk) => {
      if (m.id !== runId) return
      if (buffer) buffer.push(m)
      else term.write(m.data)
    })
    window.api
      .invoke('runs:output', runId)
      .then((s) => {
        if (disposed) return
        const { text, length } = s as { text: string; length: number }
        term.write(text)
        // Chunks already inside the snapshot are skipped (or trimmed).
        for (const c of buffer ?? []) {
          const skip = length - c.offset
          if (skip < c.data.length) term.write(skip > 0 ? c.data.slice(skip) : c.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        buffer = undefined
      })
    term.onData((d) => {
      window.api.invoke('runs:input', runId, d).catch(() => {})
    })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      off()
      ro.disconnect()
      term.dispose()
    }
  }, [runId, live])

  return (
    <div className="term">
      <div ref={el} className="term-host" role="log" aria-label="Terminal" data-readonly={!live} />
    </div>
  )
}
