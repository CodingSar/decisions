import * as monaco from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'

// Monaco diff of one changed file: HEAD on the left, working tree on the right.
export function DiffView({ project, path }: { project: string; path: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [sides, setSides] = useState<{ original: string; modified: string }>()

  useEffect(() => {
    let stale = false
    setSides(undefined)
    window.api
      .invoke('git:diff', project, path)
      .then((s) => {
        if (!stale) setSides(s as typeof sides)
      })
      .catch(() => {
        if (!stale) setSides({ original: '', modified: '' })
      })
    return () => {
      stale = true
    }
  }, [project, path])

  useEffect(() => {
    if (!host.current || !sides) return
    const uri = monaco.Uri.file(`/${path}`)
    const original = monaco.editor.createModel(
      sides.original,
      undefined,
      uri.with({ scheme: 'head' }),
    )
    const modified = monaco.editor.createModel(
      sides.modified,
      undefined,
      uri.with({ scheme: 'work' }),
    )
    const ed = monaco.editor.createDiffEditor(host.current, {
      readOnly: true,
      theme: 'vs-dark',
      automaticLayout: true,
      renderSideBySide: false,
      minimap: { enabled: false },
      fontFamily: "'IBM Plex Mono', monospace",
    })
    ed.setModel({ original, modified })
    return () => {
      ed.dispose()
      original.dispose()
      modified.dispose()
    }
  }, [path, sides])

  return (
    <section aria-label="Git view" className="files-view">
      <div className="file-head">
        <h2>{path}</h2>
      </div>
      <div className="code" ref={host} />
    </section>
  )
}
