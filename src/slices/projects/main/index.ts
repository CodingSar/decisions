import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { app, type BrowserWindow, dialog, ipcMain } from 'electron'
import type { ProjectsState } from '../model'

// Open Projects (tab order + active) persist in userData; Runs do not resume.
export function registerProjects(
  win: BrowserWindow,
  onSetup: (path: string) => void,
  onClose: (path: string) => void = () => {},
) {
  const file = join(app.getPath('userData'), 'projects.json')
  let paths: string[] = []
  let active: string | undefined
  let recent: string[] = []
  try {
    ;({ paths, active, recent = [] } = JSON.parse(readFileSync(file, 'utf8')))
  } catch {}

  const state = (): ProjectsState => ({
    tabs: paths.map((path) => ({ path, name: basename(path), available: existsSync(path) })),
    active,
    recent: recent
      .filter((path) => existsSync(path))
      .map((path) => ({ path, name: basename(path), available: true })),
  })
  const changed = () => {
    writeFileSync(file, JSON.stringify({ paths, active, recent }))
    win.webContents.send('projects:changed', state())
  }

  ipcMain.handle('projects:list', state)
  ipcMain.handle('projects:pick', async () => {
    const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
    return r.canceled ? undefined : r.filePaths[0]
  })
  ipcMain.handle('projects:open', (_e, folder: string, setup = false) => {
    const path = resolve(folder)
    if (!existsSync(path)) return
    mkdirSync(join(path, '.decisions'), { recursive: true })
    if (!paths.includes(path)) paths.push(path)
    recent = recent.filter((p) => p !== path)
    active = path
    changed()
    if (setup) onSetup(path)
  })
  ipcMain.handle('projects:focus', (_e, path: string) => {
    if (!paths.includes(path) || !existsSync(path)) return
    active = path
    changed()
  })
  ipcMain.handle('projects:close', (_e, path: string) => {
    onClose(path)
    paths = paths.filter((p) => p !== path)
    recent = [path, ...recent.filter((p) => p !== path)].slice(0, 10)
    if (active === path) active = paths.at(-1)
    changed()
  })

  return { active: () => active }
}
