import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import { attach, detach } from './terminals'

export function Terminal({ runId, live }: { runId: string; live: boolean }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = el.current as HTMLDivElement
    const t = attach(runId, host)
    host.dataset.renderer = t.renderer
    // Fit on the unpadded host, once per frame; always tell the PTY, so the TUI redraws at the real size.
    let frame = 0
    const refit = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        t.fit.fit()
        window.api.invoke('runs:resize', runId, t.term.cols, t.term.rows)
      })
    }
    const ro = new ResizeObserver(refit)
    ro.observe(host)
    refit()
    let shown = true
    document.fonts.ready.then(() => {
      if (shown) refit()
    })
    return () => {
      shown = false
      cancelAnimationFrame(frame)
      ro.disconnect()
      detach(runId)
    }
  }, [runId])

  useEffect(() => {
    const t = attach(runId, el.current as HTMLDivElement)
    t.term.options.disableStdin = !live
  }, [runId, live])

  return (
    <div className="term">
      <div ref={el} className="term-host" role="log" aria-label="Terminal" data-readonly={!live} />
    </div>
  )
}
