import { ipcMain } from 'electron'
import type { ScopeSetting } from '../model'
import { readScopes, writeScopes } from '../store'

export const scopeSettings = readScopes

export const scopeNames = (project: string) => readScopes(project).map((s) => s.name)

export function registerScopes() {
  ipcMain.handle('scopes:get', (_e, project: string) => readScopes(project))
  ipcMain.handle('scopes:set', (_e, project: string, scopes: ScopeSetting[]) =>
    writeScopes(project, scopes),
  )
}
