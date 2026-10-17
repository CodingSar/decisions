/** Board size every Mock-up is laid out for (like `docs/mock/*.dc.html`). */
export const BOARD = { width: 1440, height: 900 }

// ADR 0010: `<name>-for-approval.html`, optionally `<name>-<round>-for-approval.html`.
const FOR_APPROVAL = /-(\d+-)?for-approval\.html$/

export const isForApproval = (rel: string) => FOR_APPROVAL.test(rel)

/** `docs/mock/x-2-for-approval.html` -> `docs/mock/x-approved.html`. */
export const approvedName = (rel: string) => rel.replace(FOR_APPROVAL, '-approved.html')

export const MOCKUP_RULE = 'mockup must be an existing file named *-for-approval.html'

/** A box in board pixels. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** An element of the Mock-up, named for the agent (`button "Sort"`, `#toolbar`). */
export interface Target {
  label: string
  box: Box
}

/** One instruction the human puts on the Mock-up. */
export type Mark =
  | { kind: 'remove'; target: Target }
  | { kind: 'move'; target: Target; to: Target }
  | { kind: 'note'; target: Target; text: string }

/** The line the agent reads. */
export const markLine = (m: Mark) =>
  m.kind === 'remove'
    ? `remove: ${m.target.label}`
    : m.kind === 'move'
      ? `move: ${m.target.label} -> ${m.to.label}`
      : `note on ${m.target.label}: ${m.text}`

const INLINE = new Set(['SPAN', 'SVG', 'PATH', 'I', 'B', 'EM', 'STRONG', 'SMALL', 'IMG', 'USE'])

/** The element worth naming: the control or block around an inline fragment. */
export function describe(el: Element): Target {
  const owner =
    (INLINE.has(el.tagName.toUpperCase())
      ? el.closest(
          'button,a,input,select,textarea,label,[role],[aria-label],[id],h1,h2,h3,li,p,header,nav,section,article,div',
        )
      : el) ?? el
  const field = /^(input|textarea|select)$/i.test(owner.tagName)
  const text = (
    owner.getAttribute('aria-label') ||
    owner.getAttribute('placeholder') ||
    owner.getAttribute('title') ||
    (field ? (owner as HTMLInputElement).value : '') ||
    owner.textContent ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
  const tag = owner.tagName.toLowerCase()
  const label = owner.id ? `${tag} #${owner.id}` : text ? `${tag} "${text}"` : tag
  const r = owner.getBoundingClientRect()
  return { label, box: { x: r.left, y: r.top, w: r.width, h: r.height } }
}
