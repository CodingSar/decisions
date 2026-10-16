import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, ipcMain } from 'electron'

// Pane widths and hidden state persist per app, in userData.
export function registerLayout() {
  const file = join(app.getPath('userData'), 'layout.json')
  ipcMain.handle('layout:get', () => {
    try {
      return JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      return {}
    }
  })
  ipcMain.handle('layout:set', (_e, layout: unknown) => writeFileSync(file, JSON.stringify(layout)))
}
