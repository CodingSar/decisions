import { useEffect, useState } from 'react'
import { v } from './look'
import type { Live } from './terminals'

const decor = () => ({
  matchBackground: v('--accent-bg'),
  matchOverviewRuler: v('--amber'),
  activeMatchBackground: v('--accent-solid'),
  activeMatchColorOverviewRuler: v('--accent-solid'),
})

const Arrow = ({ up }: { up?: boolean }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} />
  </svg>
)

// Find in the Run's scrollback: Enter next, Shift+Enter previous, Esc back to the terminal.
export function Search({ live, onClose }: { live: Live; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<{ resultIndex: number; resultCount: number }>()
  useEffect(() => {
    const d = live.search.onDidChangeResults(setHits)
    return () => {
      d.dispose()
      live.search.clearDecorations()
    }
  }, [live])
  const next = (term = q) => live.search.findNext(term, { incremental: true, decorations: decor() })
  const prev = () => live.search.findPrevious(q, { decorations: decor() })
  const close = () => {
    onClose()
    live.term.focus()
  }
  return (
    <search className="term-search">
      <input
        type="search"
        aria-label="Find in terminal"
        placeholder="Find"
        value={q}
        // biome-ignore lint/a11y/noAutofocus: opened by the find shortcut, the human is about to type
        autoFocus
        onChange={(e) => {
          setQ(e.target.value)
          if (e.target.value) next(e.target.value)
          else live.search.clearDecorations()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close()
          else if (e.key === 'Enter') (e.shiftKey ? prev : next)()
        }}
      />
      <span className="count" aria-live="polite">
        {q && hits ? (hits.resultCount ? `${hits.resultIndex + 1}/${hits.resultCount}` : '0') : ''}
      </span>
      <button type="button" aria-label="Previous match" title="Previous match (⇧↵)" onClick={prev}>
        <Arrow up />
      </button>
      <button type="button" aria-label="Next match" title="Next match (↵)" onClick={() => next()}>
        <Arrow />
      </button>
      <button type="button" aria-label="Close find" title="Close find (Esc)" onClick={close}>
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
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </search>
  )
}
