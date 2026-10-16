import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CODE, Glyph, PENCIL, PILCROW } from '../../../shared/ui/Glyph'
import { CodeView } from './CodeView'

const isMarkdown = (path: string) => path.endsWith('.md')

// Resolve a link relative to the open file; the Project-relative path (`..` past the root is dropped).
function resolveLink(from: string, href: string) {
  const parts = from.split('/').slice(0, -1)
  for (const seg of href.split('#')[0].split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

const SAVE_DELAY = 500
const SAVED_FOR = 1500

export function FilesView({
  project,
  path,
  run,
  onOpen,
}: {
  project: string
  path?: string
  /** The running Run of this Project, which locks editing. */
  run?: { name: string }
  onOpen: (path: string) => void
}) {
  // undefined: loading; null: not on disk.
  const [text, setText] = useState<string | null>()
  const [source, setSource] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  // "Saved" shows briefly; a failure stays until the next successful write.
  const [status, setStatus] = useState<{ state: 'saved' | 'error'; text: string }>()
  const statusTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  // Debounced save, keyed by the file it belongs to.
  const pending = useRef<
    { project: string; path: string; value: string; timer: NodeJS.Timeout } | undefined
  >(undefined)

  const saved = () => {
    setStatus({ state: 'saved', text: 'Saved' })
    clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setStatus(undefined), SAVED_FOR)
  }
  const fail = (reason: string) => {
    clearTimeout(statusTimer.current)
    setStatus({ state: 'error', text: `Save failed: ${reason}` })
  }

  const flush = () => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    pending.current = undefined
    window.api
      .invoke('files:write', p.project, p.path, p.value)
      .then((r) => {
        const res = r as { ok: boolean; reason?: string } | undefined
        if (res?.ok) saved()
        else fail(res?.reason ?? 'unknown error')
      })
      .catch((e: Error) => fail(e.message))
  }

  // Closing the window inside the debounce must not lose the edit.
  // biome-ignore lint/correctness/useExhaustiveDependencies: flush only touches refs
  useEffect(() => {
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new file starts rendered
  useEffect(() => setSource(false), [path])
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new file or Run relocks
  useEffect(() => setUnlocked(false), [path, run?.name])
  // biome-ignore lint/correctness/useExhaustiveDependencies: flush is stable in effect
  useEffect(() => {
    if (!path) return
    let stale = false
    setText(undefined)
    // An unsaved buffer wins over changes on disk.
    const load = () =>
      pending.current ||
      window.api
        .invoke('files:read', project, path)
        .then((t) => !stale && !pending.current && setText((t as string | undefined) ?? null))
        .catch(() => {})
    load()
    const off = window.api.on('files:changed', (p: string) => p === project && load())
    return () => {
      stale = true
      off()
      flush() // the old file's edit lands in the old file
    }
  }, [project, path])

  const save = (value: string) => {
    if (!path) return
    clearTimeout(pending.current?.timer)
    if (value === text) {
      pending.current = undefined // typed back to the loaded text
      return
    }
    pending.current = { project, path, value, timer: setTimeout(flush, SAVE_DELAY) }
  }

  if (!path)
    return (
      <section aria-label="Files view" className="files-view" data-focus-unit="feed" tabIndex={-1}>
        <p className="empty">No file open. Pick one in the sidebar.</p>
      </section>
    )
  const rendered = isMarkdown(path) && !source
  const decisions = path.startsWith('.decisions/')
  const locked = !decisions && !!run && !unlocked
  const readOnly = decisions || locked
  return (
    <section aria-label="Files view" className="files-view" data-focus-unit="feed" tabIndex={-1}>
      <div className="file-head">
        <h2>{path}</h2>
        {status && (
          <span role="status" className="save-state" data-state={status.state}>
            {status.text}
          </span>
        )}
        {isMarkdown(path) && (
          <>
            <button
              type="button"
              aria-label="Rendered"
              aria-pressed={rendered}
              title="Rendered"
              onClick={() => setSource(false)}
            >
              <Glyph d={PILCROW} />
            </button>
            <button
              type="button"
              aria-label="Source"
              aria-pressed={!rendered}
              title="Source"
              onClick={() => setSource(true)}
            >
              <Glyph d={CODE} />
            </button>
          </>
        )}
      </div>
      {decisions && (
        <div role="status" className="file-lock">
          <span>Decisions files are read-only</span>
        </div>
      )}
      {locked && (
        <div role="status" className="file-lock">
          <span>Run {run.name} is active</span>
          <button
            type="button"
            aria-label="Edit anyway"
            title="Edit anyway"
            onClick={() => {
              setUnlocked(true)
              setSource(true) // editing happens in the source
            }}
          >
            <Glyph d={PENCIL} />
          </button>
        </div>
      )}
      {text === undefined ? null : text === null ? (
        <p className="empty">{path} not found</p>
      ) : rendered ? (
        <div className="md">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href = '', children }) => (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault()
                    if (/^https?:\/\//.test(href)) window.api.invoke('files:open-external', href)
                    else onOpen(resolveLink(path, href))
                  }}
                >
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </Markdown>
        </div>
      ) : (
        <CodeView path={path} text={text} readOnly={readOnly} onChange={save} />
      )}
    </section>
  )
}
