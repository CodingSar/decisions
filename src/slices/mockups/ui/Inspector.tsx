import { useEffect, useRef, useState } from 'react'
import { typesText } from '../../../shared/ui/keys'
import { BOARD, describe, type Mark, markLine, type Target } from '../model'

/** A Mark with the id its pin and row share. */
type Pinned = Mark & { id: number }
let next = 0
const pin = (m: Mark): Pinned => Object.assign(m, { id: ++next })

import { Board } from './Board'
import { useMockup } from './useMockup'

/** What the Inspector sends; the Feed turns it into a Verdict. */
export interface Reply {
  option?: number
  like?: boolean
  dislike?: boolean
  comment?: string
  marks?: string[]
}

const Svg = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
)

const CLOSE = 'M18 6L6 18M6 6l12 12'
const NOTE = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
const REMOVE = 'M3 3h18v18H3zM8 8l8 8M16 8l-8 8'
const TOGGLE = 'M4 7h12l-3-3M20 17H8l3 3'
const UNDO = 'M3 7v6h6M3 13a9 9 0 1 0 2.6-6.4L3 9'
const LIKE =
  'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
const DISLIKE =
  'M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17'

type Tool = 'note' | 'remove'
const DRAG = 6

function Tool({
  name,
  title,
  d,
  on,
  onClick,
}: {
  name: string
  title: string
  d: string
  on?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" aria-label={name} title={title} aria-pressed={on} onClick={onClick}>
      <Svg d={d} />
    </button>
  )
}

const mid = (t: Target) => ({ x: t.box.x + t.box.w / 2, y: t.box.y + t.box.h / 2 })

// Marks drawn on the board: a numbered pin on each target, a cross for Remove, an arrow for Move.
function Pins({ marks }: { marks: Pinned[] }) {
  return (
    <>
      <svg className="pins" width={BOARD.width} height={BOARD.height} aria-hidden="true">
        {marks.map((m) => {
          const b = m.target.box
          const a = mid(m.target)
          return (
            <g key={m.id} className={m.kind}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} />
              {m.kind === 'remove' && (
                <path d={`M${b.x} ${b.y}l${b.w} ${b.h}M${b.x + b.w} ${b.y}l${-b.w} ${b.h}`} />
              )}
              {m.kind === 'move' && (
                <path d={`M${a.x} ${a.y}L${mid(m.to).x} ${mid(m.to).y}`} markerEnd="url(#arrow)" />
              )}
            </g>
          )
        })}
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5 0 10z" fill="currentColor" stroke="none" />
          </marker>
        </defs>
      </svg>
      {marks.map((m, i) => (
        <span
          key={m.id}
          className="pin"
          style={{ left: m.target.box.x, top: m.target.box.y }}
          aria-hidden="true"
        >
          {i + 1}
        </span>
      ))}
    </>
  )
}

// The Mock-up at full size: click an element to note it or cross it out, drag it where it should
// go, flip to the approved one it replaces (T), then give the Verdict with the Marks attached.
export function Inspector({
  project,
  rel,
  options,
  onReply,
  onClose,
}: {
  project: string
  rel: string
  /** How many options the Decision offers (digits pick one). */
  options: number
  onReply: (r: Reply) => void
  onClose: () => void
}) {
  const file = useMockup(project, rel)
  const frame = useRef<HTMLIFrameElement>(null)
  const [tool, setTool] = useState<Tool>('note')
  const [marks, setMarks] = useState<Pinned[]>([])
  const [noting, setNoting] = useState<Target>()
  const [commenting, setCommenting] = useState(false)
  const [after, setAfter] = useState(true)
  const down = useRef<{ x: number; y: number; target: Target }>(null)
  const noteRef = useRef<HTMLInputElement>(null)
  const lines = () => marks.map(markLine)
  const reply = (r: Reply) => onReply({ ...r, marks: lines() })

  useEffect(() => {
    if (noting) noteRef.current?.focus()
  }, [noting])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (noting) setNoting(undefined)
        else if (commenting) setCommenting(false)
        else onClose()
        return
      }
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'z') {
        e.preventDefault()
        setMarks((m) => m.slice(0, -1))
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typesText(e.target)) return
      if (k === 'n') setTool('note')
      else if (k === 'x') setTool('remove')
      else if (k === 't') file?.before && setAfter((a) => !a)
      else if (k === 'c') setCommenting(true)
      else if (k === 'l') reply({ like: true })
      else if (k === 'd') reply({ dislike: true })
      else {
        const option = Number(k) - 1
        if (Number.isInteger(option) && option >= 0 && option < options) reply({ option })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Board pixels under the pointer and the element there.
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const s = r.width / BOARD.width
    const x = (e.clientX - r.left) / s
    const y = (e.clientY - r.top) / s
    const el = frame.current?.contentDocument?.elementFromPoint(x, y)
    return { x, y, target: el ? describe(el) : undefined }
  }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = at(e)
    if (p.target) down.current = { x: p.x, y: p.y, target: p.target }
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = down.current
    down.current = null
    if (!start) return
    const p = at(e)
    if (Math.hypot(p.x - start.x, p.y - start.y) > DRAG) {
      if (p.target && p.target.label !== start.target.label)
        setMarks((m) => [...m, pin({ kind: 'move', target: start.target, to: p.target as Target })])
    } else if (tool === 'remove')
      setMarks((m) => [...m, pin({ kind: 'remove', target: start.target })])
    else setNoting(start.target)
  }

  if (!file) return null
  const showing = after || !file.before ? file.html : file.before
  return (
    <div className="inspector">
      <div role="dialog" aria-label="Mock-up">
        <header>
          <b>Mock-up</b>
          <span>{rel}</span>
          <i />
          <Tool
            name="Note"
            title="Note (N)"
            d={NOTE}
            on={tool === 'note'}
            onClick={() => setTool('note')}
          />
          <Tool
            name="Remove"
            title="Remove (X)"
            d={REMOVE}
            on={tool === 'remove'}
            onClick={() => setTool('remove')}
          />
          {file.before && (
            <Tool
              name="Before"
              title={after ? 'Show approved (T)' : 'Show proposal (T)'}
              d={TOGGLE}
              on={!after}
              onClick={() => setAfter((a) => !a)}
            />
          )}
          <Tool
            name="Undo"
            title="Undo (⌘Z)"
            d={UNDO}
            onClick={() => setMarks((m) => m.slice(0, -1))}
          />
          <Tool name="Close" title="Close (Esc)" d={CLOSE} onClick={onClose} />
        </header>
        <div className="body">
          <Board
            key={after ? 'after' : 'before'}
            html={showing}
            title={after || !file.before ? 'Mock-up' : 'Approved Mock-up'}
            frame={frame}
          >
            {after && (
              <div className="overlay" onPointerDown={onDown} onPointerUp={onUp}>
                <Pins marks={marks} />
              </div>
            )}
          </Board>
        </div>
        <footer>
          <ol aria-label="Marks">
            {marks.map((m, i) => (
              <li key={m.id}>
                <span className="pin">{i + 1}</span>
                <span className="grow">{markLine(m)}</span>
                <button
                  type="button"
                  aria-label={`Drop Mark ${i + 1}`}
                  title="Drop"
                  onClick={() => setMarks((all) => all.filter((_, j) => j !== i))}
                >
                  <Svg d={CLOSE} size={12} />
                </button>
              </li>
            ))}
          </ol>
          {noting && (
            <input
              ref={noteRef}
              aria-label="Note"
              placeholder={`Note on ${noting.label} · ↵ adds · Esc cancels`}
              onKeyDown={(e) => {
                const text = e.currentTarget.value.trim()
                if (e.key === 'Enter' && text) {
                  setMarks((m) => [...m, pin({ kind: 'note', target: noting, text })])
                  setNoting(undefined)
                }
              }}
            />
          )}
          {commenting && (
            <input
              // biome-ignore lint/a11y/noAutofocus: the comment box is opened to be typed in
              autoFocus
              aria-label="Comment"
              placeholder="Your direction · ↵ sends · Esc cancels"
              onKeyDown={(e) => {
                const text = e.currentTarget.value.trim()
                if (e.key === 'Enter' && text) reply({ comment: text })
              }}
            />
          )}
          <div className="actions">
            <button
              type="button"
              className="act solid"
              aria-label="Like"
              title="Like: approve the Mock-up (L)"
              onClick={() => reply({ like: true })}
            >
              <Svg d={LIKE} />
            </button>
            <button
              type="button"
              className="act"
              aria-label="Dislike"
              title="Dislike: revise with the Marks (D)"
              onClick={() => reply({ dislike: true })}
            >
              <Svg d={DISLIKE} />
            </button>
            <button
              type="button"
              className="act"
              aria-label="Comment"
              title="Comment (C)"
              onClick={() => setCommenting(true)}
            >
              <Svg d={NOTE} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
