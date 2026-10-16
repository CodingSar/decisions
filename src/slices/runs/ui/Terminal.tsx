import { Terminal as Xterm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

export function Terminal({ runId, live }: { runId: string; live: boolean }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = new Xterm({ disableStdin: !live, convertEol: false })
    term.open(el.current as HTMLDivElement)
    window.api.invoke('runs:output', runId).then((s) => term.write(s as string))
    const off = window.api.on('runs:data', (m: { id: string; data: string }) => {
      if (m.id === runId) term.write(m.data)
    })
    term.onData((d) => window.api.invoke('runs:input', runId, d))
    term.onResize(({ cols, rows }) => window.api.invoke('runs:resize', runId, cols, rows))
    return () => {
      off()
      term.dispose()
    }
  }, [runId, live])

  return <div ref={el} className="term" role="log" aria-label="Terminal" data-readonly={!live} />
}
