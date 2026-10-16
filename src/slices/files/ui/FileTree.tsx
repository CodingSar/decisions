import { useEffect, useState } from 'react'
import type { FileNode } from '../model'

// Tree of one Project; refreshes when the main process reports a change.
function useTree(project: string) {
  const [nodes, setNodes] = useState<FileNode[]>([])
  useEffect(() => {
    const load = () =>
      window.api.invoke('files:list', project).then((n) => setNodes(n as FileNode[]))
    load()
    window.api.invoke('files:watch', project)
    return window.api.on('files:changed', (p: string) => p === project && load())
  }, [project])
  return nodes
}

function Nodes({
  nodes,
  depth,
  onOpen,
}: {
  nodes: FileNode[]
  depth: number
  onOpen: (path: string) => void
}) {
  const [collapsed, setCollapsed] = useState<string[]>([])
  const toggle = (path: string) =>
    setCollapsed((c) => (c.includes(path) ? c.filter((p) => p !== path) : [...c, path]))
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.path}>
          {n.children ? (
            <button
              type="button"
              aria-label={n.name}
              aria-expanded={!collapsed.includes(n.path)}
              style={{ paddingLeft: depth * 12 }}
              onClick={() => toggle(n.path)}
            >
              {n.name}
            </button>
          ) : (
            <button
              type="button"
              aria-label={n.path}
              style={{ paddingLeft: depth * 12 }}
              onClick={() => onOpen(n.path)}
            >
              {n.name}
            </button>
          )}
          {n.children && !collapsed.includes(n.path) ? (
            <Nodes nodes={n.children} depth={depth + 1} onOpen={onOpen} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function FileTree({ project, onOpen }: { project: string; onOpen: (path: string) => void }) {
  const nodes = useTree(project)
  return (
    <section aria-label="Files" className="files">
      <div className="side-head">
        <span>Files</span>
      </div>
      <Nodes nodes={nodes} depth={0} onOpen={onOpen} />
    </section>
  )
}
