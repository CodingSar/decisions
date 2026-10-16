import { useEffect, useState } from 'react'
import type { Decision } from '../../decisions'
import { childrenOf, edges, type Heat, heat, level, type Model, type Node } from '../model'
import './map.css'

// The Model, refetched when main reports a change (agents curate groma/ while Runs go).
function useModel(project: string) {
  const [model, setModel] = useState<Model | null>()
  useEffect(() => {
    let live = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = () =>
      window.api
        .invoke('architecture:model', project)
        .then((m) => live && setModel(m as Model | null))
        .catch(() => live && setModel(null))
    setModel(undefined)
    load()
    const off = window.api.on('decisions:changed', (p: string) => {
      if (p !== project) return
      clearTimeout(timer)
      timer = setTimeout(load, 200)
    })
    return () => {
      live = false
      clearTimeout(timer)
      off()
    }
  }, [project])
  return model
}

const Svg = ({ d, size = 14 }: { d: string; size?: number }) => (
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
const EXPAND = 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'
const CLOSE = 'M18 6L6 18M6 6l12 12'
const BACK = 'M15 18l-6-6 6-6'
const LAYERS = 'M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5'
const LINKS =
  'M18 2a3 3 0 100 6 3 3 0 000-6zM6 9a3 3 0 100 6 3 3 0 000-6zM18 16a3 3 0 100 6 3 3 0 000-6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4'
const CURATE =
  'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z'

// Tile and frame metrics per map size.
interface Size {
  cw: number
  ch: number
  gap: number
  pad: number
  hdr: number
  maxW: number
  chars: number
}
const SIZES: Record<'mini' | 'full', Size> = {
  full: { cw: 118, ch: 30, gap: 8, pad: 12, hdr: 30, maxW: 1000, chars: 18 },
  mini: { cw: 60, ch: 18, gap: 4, pad: 6, hdr: 18, maxW: 420, chars: 10 },
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}
interface Item {
  n: Node
  box: Box
  /** Children laid out inside the frame, relative to it. */
  cells: { n: Node; box: Box }[]
}

// Frames (containers with their children in a grid) and tiles flow in wrapped rows, in model order.
function place(shown: Node[], kids: (n: Node) => Node[], s: Size) {
  const items: Item[] = shown.map((n) => {
    const c = kids(n)
    if (!c.length) return { n, box: { x: 0, y: 0, w: s.cw, h: s.ch }, cells: [] }
    const cols = Math.min(c.length, Math.max(2, Math.ceil(Math.sqrt(c.length * 1.8))))
    const rows = Math.ceil(c.length / cols)
    return {
      n,
      box: {
        x: 0,
        y: 0,
        w: cols * (s.cw + s.gap) - s.gap + 2 * s.pad,
        h: s.hdr + rows * (s.ch + s.gap) - s.gap + s.pad,
      },
      cells: c.map((k, i) => ({
        n: k,
        box: {
          x: s.pad + (i % cols) * (s.cw + s.gap),
          y: s.hdr + Math.floor(i / cols) * (s.ch + s.gap),
          w: s.cw,
          h: s.ch,
        },
      })),
    }
  })
  let [x, y, rowH] = [s.gap, s.gap, 0]
  const pos = new Map<string, Box>()
  for (const it of items) {
    if (x > s.gap && x + it.box.w > s.maxW) [x, y, rowH] = [s.gap, y + rowH + 2 * s.gap, 0]
    it.box = { ...it.box, x, y }
    pos.set(it.n.id, it.box)
    for (const c of it.cells) pos.set(c.n.id, { ...c.box, x: x + c.box.x, y: y + c.box.y })
    x += it.box.w + 2 * s.gap
    rowH = Math.max(rowH, it.box.h)
  }
  return {
    items,
    pos,
    w: Math.max(0, ...items.map((i) => i.box.x + i.box.w)) + s.gap,
    h: y + rowH + s.gap,
  }
}

// Where the line from the centre of `a` towards `b` leaves `a`.
function anchor(a: Box, b: Box) {
  const [ax, ay, bx, by] = [a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2]
  const [dx, dy] = [bx - ax, by - ay]
  const k = Math.min(a.w / 2 / Math.abs(dx || 1e-9), a.h / 2 / Math.abs(dy || 1e-9))
  return { x: ax + dx * k, y: ay + dy * k }
}

const label = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1)}…` : t)

function Actor() {
  return (
    <g className="icon" transform="translate(14 7)">
      <circle cx={0} cy={0} r={2.5} />
      <path d="M0 2.5V8M-4 5H4M0 8L-3 13M0 8L3 13" />
    </g>
  )
}

/** Overview: one level at a time, every arrow of that level, click through to drill. Interactions: nested, arrows on demand. */
type View = 'overview' | 'interactions'

function Graph({
  model,
  decisions,
  into,
  view,
  size,
  selected,
  focus: want,
  onPick,
  onHover,
}: {
  model: Model
  decisions: Decision[]
  into?: string
  view: View
  size: 'mini' | 'full'
  selected?: string
  /** The element whose relationships show; the rest dims. */
  focus?: string
  onPick: (n: Node) => void
  onHover: (n?: Node) => void
}) {
  const nest = view === 'interactions'
  // The Overview spreads its tiles so arrows can pass between them.
  const s = nest ? SIZES[size] : { ...SIZES[size], gap: SIZES[size].gap * 3 }
  const shown = level(model, into)
  // Interactions nest Components in their Container; the drilled-into level and its neighbours stay flat.
  const kids = (n: Node) => (!nest || into || n.kind === 'component' ? [] : childrenOf(model, n.id))
  const { items, pos, w, h } = place(shown, kids, s)
  const all = [...shown, ...items.flatMap((i) => i.cells.map((c) => c.n))]
  const focus = all.some((n) => n.id === want) ? want : undefined
  const heats = heat(model, decisions)
  const incident = ([a, b]: [string, string]) => a === focus || b === focus
  const links = nest ? (focus ? edges(model, all).filter(incident) : []) : edges(model, all)
  const near = new Set(links.filter(incident).flat())
  if (focus) near.add(focus)
  for (const id of [...near]) {
    const p = model.nodes.find((n) => n.id === id)?.parent
    if (p) near.add(p)
  }

  const node = (n: Node, box: Box, children?: Item['cells']) => {
    const t: Heat | undefined = heats.get(n.id)
    const state = t?.pending ? 'pending' : t?.recent ? 'recent' : 'none'
    const frame = !!children?.length
    return (
      // biome-ignore lint/a11y/useSemanticElements: SVG has no button element
      <g
        key={n.id}
        role="button"
        tabIndex={0}
        aria-label={n.title}
        aria-pressed={selected === n.id}
        data-kind={n.kind}
        data-heat={state}
        data-count={state === 'pending' ? t?.pending : undefined}
        data-dim={focus && !near.has(n.id) ? '' : undefined}
        transform={`translate(${box.x} ${box.y})`}
        onClick={(e) => {
          e.stopPropagation()
          onPick(n)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.stopPropagation()
          onPick(n)
        }}
        onMouseEnter={() => onHover(n)}
        onMouseLeave={() => onHover(undefined)}
      >
        <rect
          className={frame ? 'shape frame' : 'shape'}
          width={box.w}
          height={box.h}
          rx={n.kind === 'actor' ? box.h / 2 : frame || n.kind === 'external' ? 3 : 4}
        />
        {n.kind === 'actor' ? <Actor /> : null}
        <text
          x={frame ? s.pad : n.kind === 'actor' ? box.w / 2 + 8 : box.w / 2}
          y={frame ? s.hdr - s.pad / 2 - 2 : box.h / 2 + 4}
          textAnchor={frame ? 'start' : 'middle'}
          className={frame ? 'ttl' : 'title'}
        >
          {label(n.title, frame ? s.chars * 2 : s.chars)}
        </text>
        {state === 'pending' ? (
          <g className="badge" transform={`translate(${box.w - 2} 2)`}>
            <circle r={frame ? 8 : 7} />
            <text textAnchor="middle" y={3.5}>
              {t?.pending}
            </text>
          </g>
        ) : null}
        {children?.map((c) => node(c.n, c.box))}
      </g>
    )
  }

  // Arrows bow to the right of their direction, so opposite arrows stay apart; the view grows to hold the bows.
  const box = { x0: 0, y0: 0, x1: w, y1: h }
  const arcs = links.flatMap(([a, b]) => {
    const [pa, pb] = [pos.get(a), pos.get(b)]
    if (!pa || !pb) return []
    const [f, t] = [anchor(pa, pb), anchor(pb, pa)]
    const [mx, my] = [(f.x + t.x) / 2 - (t.y - f.y) * 0.3, (f.y + t.y) / 2 + (t.x - f.x) * 0.3]
    const [px, py] = [(f.x + 2 * mx + t.x) / 4, (f.y + 2 * my + t.y) / 4] // the curve's midpoint
    box.x0 = Math.min(box.x0, px - s.gap)
    box.y0 = Math.min(box.y0, py - s.gap)
    box.x1 = Math.max(box.x1, px + s.gap)
    box.y1 = Math.max(box.y1, py + s.gap)
    const ends: [string, string] = [a, b]
    return [{ id: `${a}>${b}`, ends, d: `M${f.x} ${f.y}Q${mx} ${my} ${t.x} ${t.y}` }]
  })
  const [vw, vh] = [box.x1 - box.x0, box.y1 - box.y0]

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG has no fieldset
    <svg
      viewBox={`${box.x0} ${box.y0} ${vw} ${vh}`}
      role="group"
      aria-label="Architecture"
      data-size={size}
      data-focus={focus ? '' : undefined}
      preserveAspectRatio="xMinYMin meet"
      style={{ maxWidth: vw * 2, maxHeight: vh * 2 }}
    >
      <defs>
        <marker
          id={`arrow-${size}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10z" />
        </marker>
      </defs>
      {items.map((it) => node(it.n, it.box, it.cells))}
      {arcs.map((e) => (
        <path
          key={e.id}
          data-edge={e.id}
          data-dim={focus && !incident(e.ends) ? '' : undefined}
          d={e.d}
          markerEnd={`url(#arrow-${size})`}
        />
      ))}
    </svg>
  )
}

// A short list of Decisions; a click goes to the Decision in its view (plain rows without onOpen).
function Rows({
  ids,
  decisions,
  onOpen,
}: {
  ids: number[]
  decisions: Decision[]
  onOpen?: (d: Decision) => void
}) {
  return (
    <ul>
      {ids.map((id) => {
        const d = decisions.find((x) => x.id === id)
        if (!d) return null
        const row = (
          <>
            <b>D{id}</b> <span>{d.question}</span>
            <small>{d.status}</small>
          </>
        )
        return (
          <li key={id}>
            {onOpen ? (
              <button type="button" onClick={() => onOpen(d)}>
                {row}
              </button>
            ) : (
              <span className="row">{row}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** The Decision map: mini in the sidebar, the same graph larger in a modal with a side panel. */
export function DecisionMap({
  project,
  decisions,
  onOpen,
}: {
  project: string
  decisions: Decision[]
  /** Go to a Decision (closes the modal). */
  onOpen: (d: Decision) => void
}) {
  const model = useModel(project)
  const [into, setInto] = useState<string[]>([])
  const [view, setView] = useState<View>('overview')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState<string>()
  const [hover, setHover] = useState<Node>()

  // Another Project, another map.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on Project change only
  useEffect(() => {
    setInto([])
    setSelected(undefined)
  }, [project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(false)
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setModal((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (model === undefined) return null
  if (model === null)
    return (
      <section className="map empty" aria-label="Decision map">
        <p>No Decision map yet</p>
        <button
          type="button"
          aria-label="Build the map with a Run"
          title="Build the map with a Run"
          onClick={() => window.api.invoke('architecture:curate')}
        >
          <Svg d={CURATE} size={16} />
        </button>
      </section>
    )

  const current = into.at(-1)
  const heats = heat(model, decisions)
  const pick = (n: Node, inModal: boolean) => {
    setSelected(n.id)
    setHover(undefined)
    if (childrenOf(model, n.id).length) setInto((p) => [...p, n.id])
    else if (!inModal) setModal(true)
  }
  const crumbs = [
    project.split('/').pop(),
    ...into.map((i) => model.nodes.find((n) => n.id === i)?.title),
  ]
  const hot = hover ? (heats.get(hover.id)?.ids ?? []) : []
  const side = selected ? (heats.get(selected)?.ids ?? []) : []
  const graph = (inModal: boolean) => (
    <Graph
      model={model}
      decisions={decisions}
      into={current}
      view={view}
      size={inModal ? 'full' : 'mini'}
      selected={inModal ? selected : undefined}
      focus={hover?.id ?? (inModal ? selected : undefined)}
      onPick={(n) => pick(n, inModal)}
      onHover={setHover}
    />
  )
  const tabs = (
    <>
      {(
        [
          ['overview', 'Overview', LAYERS],
          ['interactions', 'Interactions', LINKS],
        ] as const
      ).map(([v, name, d]) => (
        <button
          key={v}
          type="button"
          aria-label={name}
          title={name}
          aria-pressed={view === v}
          onClick={() => setView(v)}
        >
          <Svg d={d} />
        </button>
      ))}
    </>
  )
  const back = (
    <button
      type="button"
      aria-label="Up"
      title="Up"
      disabled={!into.length}
      onClick={() => setInto((p) => p.slice(0, -1))}
    >
      <Svg d={BACK} />
    </button>
  )

  return (
    <>
      <section className="map" aria-label="Decision map">
        <header>
          {back}
          <span>Decision map</span>
          {tabs}
          <button
            type="button"
            aria-label="Open Decision map"
            title="Open Decision map (⌘⇧M)"
            onClick={() => setModal(true)}
          >
            <Svg d={EXPAND} />
          </button>
        </header>
        {graph(false)}
        {hot.length ? (
          <div role="tooltip">
            <Rows ids={hot} decisions={decisions} />
          </div>
        ) : null}
      </section>
      {modal ? (
        <div className="map-modal">
          <div role="dialog" aria-label="Decision map">
            <header>
              {back}
              <b>Decision map</b>
              <span>{crumbs.join(' / ')}</span>
              <i />
              {tabs}
              <button
                type="button"
                aria-label="Close"
                title="Close (Esc)"
                onClick={() => setModal(false)}
              >
                <Svg d={CLOSE} size={18} />
              </button>
            </header>
            <div className="body">
              <div className="graph">{graph(true)}</div>
              <aside aria-label="Decisions">
                <b>{model.nodes.find((n) => n.id === selected)?.title ?? 'Select an element'}</b>
                <Rows
                  ids={side}
                  decisions={decisions}
                  onOpen={(d) => {
                    setModal(false)
                    onOpen(d)
                  }}
                />
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
