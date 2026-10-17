import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { BOARD } from '../model'

/** Scale that fits the board into `width` pixels. */
export const fit = (width: number) => width / BOARD.width

// A Mock-up laid out at board size (1440x900) and scaled down to the width it gets. Scripts in the
// Mock-up never run; the same origin lets the Inspector look at its elements.
export function Board({
  html,
  title,
  frame,
  children,
}: {
  html: string
  title: string
  frame?: React.RefObject<HTMLIFrameElement | null>
  /** Drawn over the board, in board pixels scaled with it. */
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(fit(el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="board" style={{ height: BOARD.height * scale }}>
      <div
        className="board-stage"
        style={{ width: BOARD.width, height: BOARD.height, transform: `scale(${scale})` }}
      >
        <iframe ref={frame} title={title} sandbox="allow-same-origin" srcDoc={html} />
        {children}
      </div>
    </div>
  )
}
