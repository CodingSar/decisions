import type { Decision } from '../decisions'

export type Kind = 'actor' | 'external' | 'system' | 'container' | 'component'

/** An element of the Project's Groma model. */
export interface Node {
  id: string
  title: string
  kind: Kind
  parent?: string
  description?: string
}

/** The Groma model: elements and their relationships (source id, target id). */
export interface Model {
  nodes: Node[]
  edges: [string, string][]
}

/** What the Decisions say about one element, rolled up from its descendants. */
export interface Heat {
  /** Non-superseded Decisions touching the element, newest first. */
  ids: number[]
  pending: number
  recent: boolean
}

const WEEK = 7 * 24 * 3600_000

export const childrenOf = (m: Model, id: string) => m.nodes.filter((n) => n.parent === id)

/** Elements shown with no container selected: actors, externals, childless systems and the children of systems (or of nothing, or of a malformed parent). */
export function top(m: Model): Node[] {
  const holds = (id?: string) =>
    m.nodes.some((n) => n.id === id && (n.kind === 'system' || n.kind === 'container'))
  return m.nodes.filter(
    (n) =>
      n.kind === 'actor' ||
      n.kind === 'external' ||
      (n.kind === 'system'
        ? !m.nodes.some((c) => c.parent === n.id)
        : !holds(n.parent) || m.nodes.find((x) => x.id === n.parent)?.kind === 'system'),
  )
}

function ancestors(m: Model, id: string): string[] {
  const out: string[] = []
  for (
    let n = m.nodes.find((x) => x.id === id);
    n && !out.includes(n.id);
    n = m.nodes.find((x) => x.id === n?.parent)
  )
    out.push(n.id)
  return out
}

/** The elements shown inside `into` (or at the top), plus the top elements they connect to. */
export function level(m: Model, into?: string): Node[] {
  const base = top(m)
  if (!into) return base
  const inside = childrenOf(m, into)
  const ids = new Set(inside.map((n) => n.id))
  const within = (id: string) => ancestors(m, id).some((a) => ids.has(a))
  const near = base.filter((n) =>
    m.edges.some(([a, b]) => (a === n.id && within(b)) || (b === n.id && within(a))),
  )
  return [...inside, ...near.filter((n) => !ids.has(n.id) && n.id !== into)]
}

/** Relationships between the shown elements; deeper endpoints stand for their shown ancestor. */
export function edges(m: Model, shown: Node[]): [string, string][] {
  const rep = (id: string) => ancestors(m, id).find((a) => shown.some((n) => n.id === a))
  const seen = new Set<string>()
  const out: [string, string][] = []
  for (const [a, b] of m.edges) {
    const [x, y] = [rep(a), rep(b)]
    if (!x || !y || x === y || seen.has(`${x}>${y}`)) continue
    seen.add(`${x}>${y}`)
    out.push([x, y])
  }
  return out
}

/** Heat per element id. Superseded Decisions and Decisions without Components do not count. */
export function heat(m: Model, all: Decision[], now = Date.now()): Map<string, Heat> {
  const out = new Map<string, Heat>()
  for (const d of all) {
    const superseded = all.some((e) => e.status === 'answered' && e.supersedes === d.id)
    if (superseded || !d.components?.length) continue
    const recent = d.status === 'answered' && !!d.answered && now - d.answered < WEEK
    for (const id of new Set(d.components.flatMap((c) => ancestors(m, c)))) {
      const h = out.get(id) ?? { ids: [], pending: 0, recent: false }
      h.ids.push(d.id)
      if (d.status === 'pending') h.pending++
      if (recent) h.recent = true
      out.set(id, h)
    }
  }
  for (const h of out.values()) h.ids.sort((a, b) => b - a)
  return out
}
