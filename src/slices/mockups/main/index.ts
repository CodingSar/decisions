import { existsSync, readFileSync, renameSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { ipcMain } from 'electron'
import { approvedName, isForApproval, MOCKUP_RULE } from '../model'

export { MOCKUP_RULE }

// Resolved file inside the Project root, or undefined when it escapes.
function inside(project: string, rel: string) {
  const root = resolve(project)
  const file = resolve(root, rel)
  return file.startsWith(root + sep) ? file : undefined
}

/** Whether `rel` follows ADR 0010 and exists in the Project. */
export function validMockup(project: string, rel: string) {
  const file = inside(project, rel)
  return !!file && isForApproval(rel) && existsSync(file)
}

/** Approval promotes the file: `-for-approval` becomes `-approved`, replacing the earlier one. */
export function approveMockup(project: string, rel: string) {
  const file = inside(project, rel)
  const to = inside(project, approvedName(rel))
  if (file && to && existsSync(file)) renameSync(file, to)
}

export function registerMockups() {
  // The Mock-up's HTML and, when an earlier approved one exists, the Before image.
  ipcMain.handle('mockups:read', (_e, project: string, rel: string) => {
    const file = inside(project, rel)
    if (!file || !existsSync(file)) return
    const before = inside(project, approvedName(rel))
    return {
      html: readFileSync(file, 'utf8'),
      before:
        before && before !== file && existsSync(before) ? readFileSync(before, 'utf8') : undefined,
    }
  })
}
