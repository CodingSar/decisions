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
  const [text, setText] = useState<string>()
  const [source, setSource] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [failed, setFailed] = useState(false)
  // Debounced save, keyed by the file it belongs to.
  const pending = useRef<
    { project: string; path: string; value: string; timer: NodeJS.Timeout } | undefined
  >(undefined)

  const fail = () => {
    setFailed(true)
    setTimeout(() => setFailed(false), 3000)
  }

  const flush = () => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    pending.current = undefined
    window.api
      .invoke('files:write', p.project, p.path, p.value)
      .then((r) => {
        if (!(r as { ok?: boolean } | undefined)?.ok) fail()
      })
      .catch(fail)
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
        .then((t) => !stale && !pending.current && setText(t as string))
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

  if (!path) return <section aria-label="Files view" />
  const rendered = isMarkdown(path) && !source
  const decisions = path.startsWith('.decisions/')
  const locked = !decisions && !!run && !unlocked
  const readOnly = decisions || locked
  return (
    <section aria-label="Files view" className="files-view">
      <div className="file-head">
        <h2>{path}</h2>
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
      {locked && (
        <div role="status" className="file-lock">
          <span>Run {run.name} is active</span>
          <button
            type="button"
            aria-label="Edit anyway"
            title="Edit anyway"
            onClick={() => setUnlocked(true)}
          >
            <Glyph d={PENCIL} />
          </button>
        </div>
      )}
      {failed && (
        <div role="status" className="file-lock">
          <span>Save failed</span>
        </div>
      )}
      {text === undefined ? null : rendered ? (
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
