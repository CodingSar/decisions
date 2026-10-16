import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { keysBlocked } from '../../../shared/ui/keys'
import type { Decision, Verdict } from '../model'
import './feed.css'

const send = (project: string, id: number, verdict: Verdict) =>
  window.api.invoke('decisions:verdict', project, id, verdict).catch(console.error)

const CLOCK = 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z'

const elapsed = (ms: number) => {
  const m = Math.floor(ms / 60_000)
  return m < 1
    ? '<1m'
    : m < 60
      ? `${m}m`
      : m < 1440
        ? `${Math.floor(m / 60)}h`
        : `${Math.floor(m / 1440)}d`
}

// Amber clock and time waited; re-renders each second so it follows the clock.
function Waited({ since }: { since: number }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="waited" role="timer" title="Waiting for you">
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={CLOCK} />
      </svg>
      {elapsed(Date.now() - since)}
    </span>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Enter sends; an empty comment is ignored. Leaving the box empty closes it, so keys and timers
// resume (an overturn copy stays: only Esc discards it); a typed draft survives a blur but not Esc,
// which cancels from anywhere (other text fields and dialogs keep their own Esc).
function CommentBox({
  hint,
  onSend,
  onCancel,
  onLeave,
}: {
  hint: string
  onSend: (text: string) => void
  onCancel: () => void
  onLeave: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (e.target === ref.current || !keysBlocked(e))) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <input
      ref={ref}
      aria-label="Comment"
      placeholder={hint}
      onBlur={(e) => e.currentTarget.value.trim() || onLeave()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) onSend(e.currentTarget.value.trim())
      }}
    />
  )
}

const LIKE =
  'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
const DISLIKE =
  'M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17'
const COMMENT = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
const TERMINAL = 'M4 17l6-5-6-5M12 19h8'

function Act({
  label,
  name,
  d,
  solid,
  onClick,
}: {
  label: string
  name: string
  d: string
  solid?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={solid ? 'act solid' : 'act'}
      aria-label={name}
      title={label}
      onClick={onClick}
    >
      <svg
        width={16}
        height={16}
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
    </button>
  )
}

function Card({
  d,
  project,
  focused,
  box,
  onFocus,
  onBlur,
  onComment,
  onShowRun,
}: {
  d: Decision
  project: string
  focused: boolean
  box?: ReactNode
  onFocus: () => void
  onBlur: () => void
  onComment: () => void
  onShowRun?: () => void
}) {
  return (
    <article
      aria-label={`D${d.id}`}
      aria-current={focused}
      data-focus-unit="feed"
      tabIndex={-1}
      onFocus={onFocus}
      onBlur={(e) => e.currentTarget.contains(e.relatedTarget) || onBlur()}
    >
      <div className="meta">
        <span>D{d.id}</span>
        <span className="chip">{cap(d.scope)}</span>
        <span>{d.agent.replaceAll(' > ', ' › ')}</span>
        {d.asked && <Waited since={d.asked} />}
      </div>
      <p className="question">{d.question}</p>
      <ul className="options">
        {d.options.map((o, i) => (
          <li key={o} className={i === d.recommended ? 'rec' : undefined}>
            <button
              type="button"
              aria-label={`${i + 1} ${o}`}
              title={`Choose option ${i + 1} (${i + 1})`}
              onClick={() => send(project, d.id, { option: i })}
            >
              <span>{i + 1}</span>
              <span className="grow">{o}</span>
            </button>
            {i === d.recommended && (
              <svg
                role="img"
                aria-label="Recommended"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <title>Recommended</title>
                <path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" />
              </svg>
            )}
          </li>
        ))}
      </ul>
      <div className="actions">
        <Act
          label="Like: take the recommended option (L)"
          name="Like"
          d={LIKE}
          solid
          onClick={() => send(project, d.id, { like: true })}
        />
        <Act
          label="Dislike (D)"
          name="Dislike"
          d={DISLIKE}
          onClick={() => send(project, d.id, { dislike: true })}
        />
        <Act label="Comment (C)" name="Comment" d={COMMENT} onClick={onComment} />
        {d.run && onShowRun && (
          <>
            <span className="grow" />
            <Act label="Show in Run (J)" name="Show in Run" d={TERMINAL} onClick={onShowRun} />
          </>
        )}
      </div>
      {box}
    </article>
  )
}

// Keys act on the focused card, else the oldest pending one.
export function Feed({
  project,
  pending,
  runIds,
  focus,
  newestFirst = false,
  onShowRun,
}: {
  project: string
  pending: Decision[]
  /** Runs that still exist: only their Decisions offer Show in Run. */
  runIds: string[]
  /** The card to focus, e.g. a fresh overturn copy or one opened from the map. */
  focus?: { id: number }
  newestFirst?: boolean
  /** Jump to the terminal line where the Decision was raised. */
  onShowRun?: (d: Decision) => void
}) {
  const [focusId, setFocusId] = useState(focus?.id)
  const [commenting, setCommenting] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const first = pending.find((d) => d.id === focusId) ?? pending[0]
  const hasRun = (d: Decision) => d.run !== undefined && runIds.includes(d.run)

  // An open comment box pauses every timeout.
  useEffect(() => {
    window.api.invoke('decisions:working', commenting)
    return () => void window.api.invoke('decisions:working', false)
  }, [commenting])
  // A new oldest card starts without a comment box, except an overturn, which opens with one.
  // Layout effects: the box state and the key listener settle before the card is painted, so a
  // key pressed as soon as it shows acts on it instead of being lost or undone by the reset.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a change of card resets it
  useLayoutEffect(() => setCommenting(first?.supersedes !== undefined), [first?.id])
  // With nothing (or only the view) focused, focus lands on the first card, so the ring always
  // shows where keys act.
  useEffect(() => {
    const at = document.activeElement
    if (first && (at === document.body || at === ref.current))
      document.querySelector<HTMLElement>(`[aria-label="D${first.id}"]`)?.focus()
  }, [first])
  useEffect(() => {
    if (!focus) return
    setFocusId(focus.id)
    document.querySelector<HTMLElement>(`[aria-label="D${focus.id}"]`)?.focus()
  }, [focus])
  useLayoutEffect(() => {
    if (!first || commenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || keysBlocked(e)) return
      const k = e.key.toLowerCase()
      if (k === 'c') {
        e.preventDefault()
        setCommenting(true)
        return
      }
      if (k === 'j') return first.run && runIds.includes(first.run) && onShowRun?.(first)
      const option = Number(k) - 1
      const verdict: Verdict | undefined =
        k === 'l'
          ? { like: true }
          : k === 'd'
            ? { dislike: true }
            : Number.isInteger(option) && option >= 0 && option < first.options.length
              ? { option }
              : undefined
      if (verdict) send(project, first.id, verdict)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, first, commenting, onShowRun, runIds])

  return (
    <section ref={ref} className="cards" aria-label="Feed" data-focus-unit="feed" tabIndex={-1}>
      {!pending.length && (
        <p className="empty">
          No pending Decisions. Start a Run and give it a task; its questions land here.
        </p>
      )}
      {(newestFirst ? [...pending].reverse() : pending).map((d) => (
        <Card
          key={d.id}
          d={d}
          project={project}
          focused={d === first}
          onFocus={() => setFocusId(d.id)}
          onBlur={() => setFocusId(undefined)}
          onComment={() => {
            setFocusId(d.id)
            setCommenting(true)
          }}
          onShowRun={hasRun(d) ? () => onShowRun?.(d) : undefined}
          box={
            commenting && d === first ? (
              <CommentBox
                hint={
                  d.supersedes
                    ? 'Why overturn? · ↵ sends · Esc discards'
                    : 'Your direction · ↵ sends · Esc cancels'
                }
                onSend={(comment) => send(project, d.id, { comment })}
                onCancel={() =>
                  d.supersedes
                    ? window.api.invoke('decisions:discard', project, d.id)
                    : setCommenting(false)
                }
                onLeave={() => setCommenting(false)}
              />
            ) : undefined
          }
        />
      ))}
    </section>
  )
}
