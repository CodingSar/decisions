import { type ReactNode, useEffect, useState } from 'react'

type Side = 'sidebar' | 'terminal'
interface PaneState {
  width: number
  hidden: boolean
}
type Layout = Record<Side, PaneState>

const DEFAULTS: Layout = {
  sidebar: { width: 220, hidden: false },
  terminal: { width: 420, hidden: false },
}
const MIN = 120
const EDGE = 20

// Widths and hidden state, loaded from and saved to app data.
export function useLayout() {
  const [layout, setLayout] = useState<Layout>()
  useEffect(() => {
    window.api
      .invoke('layout:get')
      .then((l) => setLayout({ ...DEFAULTS, ...(l as Partial<Layout>) }))
  }, [])
  const update = (side: Side, patch: Partial<PaneState>) =>
    setLayout((l) => {
      if (!l) return l
      const next = { ...l, [side]: { ...l[side], ...patch } }
      window.api.invoke('layout:set', next)
      return next
    })
  return { layout, update }
}

export type LayoutState = NonNullable<ReturnType<typeof useLayout>['layout']>

export const columns = (l: Layout) =>
  `${l.sidebar.hidden ? EDGE : l.sidebar.width}px 1fr ${l.terminal.hidden ? EDGE : l.terminal.width}px`

const label = (side: Side) => (side === 'sidebar' ? 'sidebar' : 'terminal')

// A hideable pane with a drag handle on its inner edge; hidden, only an arrow strip remains.
export function Pane({
  side,
  state,
  onChange,
  children,
}: {
  side: Side
  state: PaneState
  onChange: (patch: Partial<PaneState>) => void
  children: ReactNode
}) {
  const left = side === 'sidebar'
  if (state.hidden)
    return (
      <div className="strip">
        <button
          type="button"
          aria-label={`Show ${label(side)}`}
          title={`Show ${label(side)}`}
          onClick={() => onChange({ hidden: false })}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={left ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
          </svg>
        </button>
      </div>
    )

  const drag = (e: React.MouseEvent) => {
    const x0 = e.clientX
    const w0 = state.width
    let width = w0
    const move = (m: MouseEvent) => {
      width = Math.max(MIN, w0 + (left ? m.clientX - x0 : x0 - m.clientX))
      onChange({ width })
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className={`pane ${side}`}>
      {children}
      <button
        type="button"
        className="hide"
        aria-label={`Hide ${label(side)}`}
        title={`Hide ${label(side)}`}
        onClick={() => onChange({ hidden: true })}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
      {/* biome-ignore lint/a11y/useSemanticElements: a draggable splitter, not a thematic break */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${label(side)}`}
        className="handle"
        onMouseDown={drag}
      />
    </div>
  )
}
