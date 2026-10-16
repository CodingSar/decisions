import {
  existsSync,
  type FSWatcher,
  readdirSync,
  readFileSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { join, resolve, sep } from 'node:path'
import type { BrowserWindow } from 'electron'
import { ipcMain, shell } from 'electron'
import ignore from 'ignore'
import type { FileNode } from '../model'

// Tree of a Project folder: root .gitignore applies, `.git` is always hidden.
function tree(root: string): FileNode[] {
  const ig = ignore().add('.git')
  const gitignore = join(root, '.gitignore')
  if (existsSync(gitignore)) ig.add(readFileSync(gitignore, 'utf8'))
  const walk = (rel: string): FileNode[] =>
    readdirSync(join(root, rel), { withFileTypes: true })
      .map((e) => ({ e, path: rel ? `${rel}/${e.name}` : e.name }))
      .filter(({ e, path }) => !ig.ignores(e.isDirectory() ? `${path}/` : path))
      .map(({ e, path }) =>
        e.isDirectory() ? { name: e.name, path, children: walk(path) } : { name: e.name, path },
      )
      .sort((a, b) => Number(!!b.children) - Number(!!a.children) || a.name.localeCompare(b.name))
  return walk('')
}

// Resolved file inside the Project root, or undefined when it escapes.
function inside(project: string, rel: string) {
  const root = resolve(project)
  const file = resolve(root, rel)
  return file.startsWith(root + sep) ? { root, file } : undefined
}

export function registerFiles(win: BrowserWindow) {
  const watchers = new Map<string, FSWatcher>()
  let lastExternal: string | undefined
  ipcMain.handle('files:list', (_e, project: string) => (existsSync(project) ? tree(project) : []))
  ipcMain.handle('files:read', (_e, project: string, rel: string) => {
    const hit = inside(project, rel)
    if (!hit || !existsSync(hit.file)) return
    return readFileSync(hit.file, 'utf8')
  })
  ipcMain.handle('files:write', (_e, project: string, rel: string, text: string) => {
    const hit = inside(project, rel)
    // `.decisions/` is owned by the app.
    const owned = hit && resolve(hit.root, '.decisions') + sep
    if (!hit || hit.file.startsWith(owned as string) || !existsSync(hit.file)) return { ok: false }
    try {
      writeFileSync(hit.file, text)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })
  ipcMain.handle('files:open-external', (_e, url: string) => {
    if (!/^https?:\/\//.test(url)) return
    // Tests assert the URL instead of launching a browser.
    if (process.env.DECISIONS_RUNTIME) lastExternal = url
    else shell.openExternal(url)
  })
  if (process.env.DECISIONS_RUNTIME) ipcMain.handle('files:last-external', () => lastExternal)
  // One recursive watcher per Project; the renderer re-lists on `files:changed`.
  ipcMain.handle('files:watch', (_e, project: string) => {
    if (watchers.has(project) || !existsSync(project)) return
    let timer: NodeJS.Timeout | undefined
    let w: FSWatcher
    try {
      w = watch(project, { recursive: true }, (_ev, name) => {
        const n = name?.split(sep).join('/')
        if (n?.startsWith('.git/') || n === '.git') return
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (!win.isDestroyed()) win.webContents.send('files:changed', project)
        }, 100)
      })
    } catch {
      return
    }
    // The Project folder may vanish (deleted, unmounted): stop watching it.
    w.on('error', () => {
      clearTimeout(timer)
      w.close()
      watchers.delete(project)
    })
    watchers.set(project, w)
  })
  return {
    stop(project: string) {
      watchers.get(project)?.close()
      watchers.delete(project)
    },
  }
}
