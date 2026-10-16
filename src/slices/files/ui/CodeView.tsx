import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import { useEffect, useRef } from 'react'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }

// Monaco picks the language from the file name.
export function CodeView({
  path,
  text,
  readOnly,
  onChange,
}: {
  path: string
  text: string
  readOnly: boolean
  onChange: (text: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined)
  const change = useRef(onChange)
  change.current = onChange

  // biome-ignore lint/correctness/useExhaustiveDependencies: text and readOnly update the live editor below
  useEffect(() => {
    if (!host.current) return
    const model = monaco.editor.createModel(text, undefined, monaco.Uri.file(`/${path}`))
    const ed = monaco.editor.create(host.current, {
      model,
      readOnly,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: "'IBM Plex Mono', monospace",
    })
    ed.onDidChangeModelContent(() => change.current(model.getValue()))
    editor.current = ed
    return () => {
      ed.dispose()
      model.dispose()
    }
  }, [path])

  useEffect(() => editor.current?.updateOptions({ readOnly }), [readOnly])
  useEffect(() => {
    const model = editor.current?.getModel()
    if (model && model.getValue() !== text) model.setValue(text)
  }, [text])

  return <div className="code" ref={host} data-readonly={readOnly} />
}
