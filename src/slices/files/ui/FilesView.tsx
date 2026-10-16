import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeView } from './CodeView'

const isMarkdown = (path: string) => path.endsWith('.md')

// Resolve a link relative to the open file; undefined when it leaves the Project.
function resolveLink(from: string, href: string) {
  const parts = from.split('/').slice(0, -1)
  for (const seg of href.split('#')[0].split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

export function FilesView({
  project,
  path,
  onOpen,
}: {
  project: string
  path?: string
  onOpen: (path: string) => void
}) {
  const [text, setText] = useState<string>()
  const [source, setSource] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new file starts rendered
  useEffect(() => setSource(false), [path])
  useEffect(() => {
    if (!path) return
    const load = () =>
      window.api.invoke('files:read', project, path).then((t) => setText(t as string))
    load()
    return window.api.on('files:changed', (p: string) => p === project && load())
  }, [project, path])

  if (!path) return <section aria-label="Files view" />
  const rendered = isMarkdown(path) && !source
  // TASK-18 lifts this outside `.decisions/` when no Run is active.
  const readOnly = true
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
              ¶
            </button>
            <button
              type="button"
              aria-label="Source"
              aria-pressed={!rendered}
              title="Source"
              onClick={() => setSource(true)}
            >
              {'</>'}
            </button>
          </>
        )}
      </div>
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
        <CodeView path={path} text={text} readOnly={readOnly} />
      )}
    </section>
  )
}
