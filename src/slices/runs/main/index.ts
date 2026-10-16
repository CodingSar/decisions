import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { type BrowserWindow, ipcMain } from 'electron'
import { type AgentSession, getRuntime } from '../../agent-runtimes/main'
import type { Run } from '../model'

// Past Verdicts live in the folder; a Run that was not blocked on them reads them from there.
const POINTER = 'Past Decisions are in .decisions/'

function hasDecisions(cwd: string) {
  try {
    return readdirSync(join(cwd, '.decisions')).some((n) => /^D\d+\.md$/.test(n))
  } catch {
    return false
  }
}

export function registerRuns(win: BrowserWindow, getCwd: () => string | undefined, mcpUrl: string) {
  const runs: Run[] = []
  let seq = 0
  const sessions = new Map<string, AgentSession>()
  const scrollback = new Map<string, string>()
  const cwds = new Map<string, string>()
  const pushRuns = () => win.webContents.send('runs:changed', runs)
  const emit = (id: string, data: string) => {
    const before = scrollback.get(id) ?? ''
    scrollback.set(id, before + data)
    win.webContents.send('runs:data', { id, data, offset: before.length })
  }

  ipcMain.handle('runs:list', () => runs)
  ipcMain.handle('runs:output', (_e, id: string) => {
    const text = scrollback.get(id) ?? ''
    return { text, length: text.length }
  })
  const create = () => {
    const id = `R${++seq}`
    runs.push({ id, name: id, status: 'idle', project: getCwd() })
    pushRuns()
    return id
  }
  const start = (id: string, prompt?: string) => {
    const run = runs.find((r) => r.id === id)
    const cwd = run?.project ?? getCwd()
    if (!run || !cwd || run.status === 'running') return
    let session: AgentSession | undefined
    try {
      session = getRuntime().start({
        cwd,
        mcpUrl: `${mcpUrl}/${id}`,
        prompt: prompt ?? (hasDecisions(cwd) ? POINTER : undefined),
        onOutput: (data) => emit(id, data),
        onExit: (code) => {
          // A late exit of a previous session must not touch its successor.
          if (sessions.get(id) !== session) return
          sessions.delete(id)
          // Stopped by the human: the status is already final.
          if (run.status === 'stopped') return
          // The session ended by itself (e.g. `exit`): the Run ends with it.
          if (code === 0 && run.status === 'running') {
            runs.splice(runs.indexOf(run), 1)
            scrollback.delete(id)
            cwds.delete(id)
            pushRuns()
            return
          }
          run.status = code === 0 ? 'stopped' : 'failed'
          pushRuns()
        },
      })
      sessions.set(id, session)
      cwds.set(id, cwd)
      run.status = 'running'
    } catch (e) {
      sessions.delete(id)
      run.status = 'failed'
      emit(id, `${(e as Error).message}\r\n`)
    }
    pushRuns()
  }

  ipcMain.handle('runs:create', create)
  ipcMain.handle('runs:start', (_e, id: string) => start(id))
  ipcMain.handle('runs:rename', (_e, id: string, name: string) => {
    const run = runs.find((r) => r.id === id)
    if (!run || !name.trim()) return
    run.name = name.trim()
    pushRuns()
  })
  const stop = (id: string) => {
    const run = runs.find((r) => r.id === id)
    if (run?.status !== 'running') return
    run.status = 'stopped'
    sessions.get(id)?.stop()
    pushRuns()
  }
  ipcMain.handle('runs:stop', (_e, id: string) => stop(id))
  ipcMain.handle('runs:input', (_e, id: string, data: string) => {
    const s = sessions.get(id)
    if (s) s.write(data)
  })
  ipcMain.handle('runs:resize', (_e, id: string, cols: number, rows: number) =>
    sessions.get(id)?.resize(cols, rows),
  )

  return {
    /** Stops every running Run of a Project (its tab closed). */
    stopProject: (path: string) => {
      for (const r of runs) if (r.project === path) stop(r.id)
    },
    startRun: (prompt: string) => start(create(), prompt),
    /** Project folder the Run was started in. */
    projectOf: (id: string) => cwds.get(id),
  }
}
