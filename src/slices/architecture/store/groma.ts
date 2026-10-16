import { type Dirent, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { Kind, Model, Node } from '../model'

const KINDS: Record<string, Kind> = {
  'C4 Actor': 'actor',
  'C4 System': 'system',
  'C4 Container': 'container',
  'C4 Component': 'component',
}

const clean = (s?: string) => s?.trim().replace(/^(['"])(.*)\1$/, '$2')

/** Ids of the Components in the Project's `groma/`, sorted. */
export function componentIds(project: string): string[] {
  return readNodes(project)
    .nodes.filter((n) => n.kind === 'component')
    .map((n) => n.id)
    .sort()
}

/** Element files of the Project's `groma/` and the Nodes in them (no edges). */
function readNodes(project: string) {
  const root = join(project, 'groma')
  const files: string[] = []
  const walk = (dir: string) => {
    let entries: Dirent[] = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {}
    for (const e of entries) {
      const path = join(dir, e.name)
      if (e.isDirectory()) walk(path)
      else if (e.name.endsWith('.md')) files.push(path)
    }
  }
  walk(root)
  const nodes: Node[] = []
  const byPath = new Map<string, string>() // element file -> id
  const byCode = new Map<string, string>() // source file -> id
  const texts = new Map<string, string>()
  for (const path of files) {
    const text = readFileSync(path, 'utf8')
    const type = /^type: (.*)$/m.exec(text)?.[1]?.trim() ?? ''
    const kind = KINDS[type]
    const id = /^ {2}id: (\S+)$/m.exec(text)?.[1]
    if (!kind || !id) continue
    const inExternals = path.startsWith(join(root, 'externals'))
    nodes.push({
      id,
      kind: kind === 'system' && inExternals ? 'external' : kind,
      title: clean(/^title: (.*)$/m.exec(text)?.[1]) ?? id,
      parent: /^ {2}parent: (\S+)$/m.exec(text)?.[1],
      description: clean(/^description: (.*)$/m.exec(text)?.[1]),
    })
    byPath.set(path, id)
    texts.set(path, text)
    for (const f of text.matchAll(/^ {6}file: (\S+)$/gm)) byCode.set(f[1] as string, id)
  }
  return { root, files, nodes, byPath, byCode, texts }
}

/** The Project's `groma/` as a Model, or null when it has none. Reads Groma's Markdown: frontmatter and Relationships tables. */
export function readModel(project: string): Model | null {
  const { files, nodes, byPath, byCode, texts } = readNodes(project)
  if (!files.length) return null
  const edges: [string, string][] = []
  const target = (from: string, cell: string) => {
    const href = /\]\(<?([^)>]+)>?\)/.exec(cell)?.[1]
    if (!href) return undefined
    const abs = resolve(dirname(from), href)
    return byPath.get(abs) ?? byCode.get(abs.slice(project.length + 1))
  }
  for (const [path, text] of texts) {
    for (const row of text.split('\n')) {
      const cells = row.split('|').map((c) => c.trim())
      if (cells.length < 4 || !cells[1]?.startsWith('[')) continue
      const [a, b] = [target(path, cells[1] ?? ''), target(path, cells[2] ?? '')]
      if (a && b) edges.push([a, b])
    }
  }
  return { nodes, edges }
}
