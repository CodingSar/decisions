import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import { useEffect, useRef } from 'react'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }

// Monaco picks the language from the file name.
export function CodeView({
  path,
  text,
  readOnly,
}: {
  path: string
  text: string
  readOnly: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const model = monaco.editor.createModel(text, undefined, monaco.Uri.file(`/${path}`))
    const editor = monaco.editor.create(host.current, {
      model,
      readOnly,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: "'IBM Plex Mono', monospace",
    })
    return () => {
      editor.dispose()
      model.dispose()
    }
  }, [path, text, readOnly])
  return <div className="code" ref={host} />
}
