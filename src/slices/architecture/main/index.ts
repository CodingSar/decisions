import { ipcMain } from 'electron'
import { componentIds, readModel } from '../store/groma'

export { componentIds }

/** `curate` starts a Run in the active Project that curates its architecture. */
export function registerArchitecture(curate: () => void) {
  ipcMain.handle('architecture:model', (_e, project: string) => readModel(project))
  ipcMain.handle('architecture:curate', () => curate())
}
