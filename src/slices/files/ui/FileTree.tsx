import { useEffect, useState } from 'react'
import { Chevron } from '../../../shared/ui/Chevron'
import { FILE, FOLDER, Glyph } from '../../../shared/ui/Glyph'
import type { FileNode } from '../model'

// Tree of one Project; refreshes when the main process reports a change.
function useTree(project: string) {
  const [nodes, setNodes] = useState<FileNode[]>([])
  useEffect(() => {
    let stale = false
    const load = () =>
      window.api.invoke('files:list', project).then((n) => !stale && setNodes(n as FileNode[]))
    load()
    window.api.invoke('files:watch', project)
    const off = window.api.on('files:changed', (p: string) => p === project && load())
    return () => {
      stale = true
      off()
    }
  }, [project])
  return nodes
}

function Nodes({
  nodes,
  depth,
  opened,
  toggle,
  onOpen,
}: {
  nodes: FileNode[]
  depth: number
  opened: Set<string>
  toggle: (path: string) => void
  onOpen: (path: string) => void
}) {
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.path}>
          {n.children ? (
            <button
              type="button"
              aria-label={n.name}
              aria-expanded={opened.has(n.path)}
              style={{ paddingLeft: 8 + depth * 14 }}
              onClick={() => toggle(n.path)}
            >
              <Chevron open={opened.has(n.path)} />
              <Glyph d={FOLDER} />
              <span>{n.name}</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label={n.path}
              style={{ paddingLeft: 8 + depth * 14 }}
              onClick={() => onOpen(n.path)}
            >
              <span className="gap" />
              <Glyph d={FILE} />
              <span>{n.name}</span>
            </button>
          )}
          {n.children && opened.has(n.path) ? (
            <Nodes
              nodes={n.children}
              depth={depth + 1}
              opened={opened}
              toggle={toggle}
              onOpen={onOpen}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function FileTree({ project, onOpen }: { project: string; onOpen: (path: string) => void }) {
  const nodes = useTree(project)
  const [open, setOpen] = useState(true)
  const [opened, setOpened] = useState<Set<string>>(new Set())
  const toggle = (path: string) =>
    setOpened((o) => {
      const next = new Set(o)
      if (!next.delete(path)) next.add(path)
      return next
    })
  const label = open ? 'Collapse Files' : 'Expand Files'
  return (
    <section aria-label="Files" className="files">
      <div className="side-head">
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          title={label}
          onClick={() => setOpen((o) => !o)}
        >
          <Chevron open={open} />
        </button>
        <span>Files</span>
      </div>
      {open ? (
        <div className="tree">
          <Nodes nodes={nodes} depth={0} opened={opened} toggle={toggle} onOpen={onOpen} />
        </div>
      ) : null}
    </section>
  )
}
