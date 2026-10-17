import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { type BrowserWindow, ipcMain, Notification } from 'electron'
import { type AgentSession, getRuntime } from '../../agent-runtimes/main'
import type { Run, Signal } from '../model'

// Past Verdicts live in the folder; a Run that was not blocked on them reads them from there.
const POINTER = 'Past Decisions are in .decisions/'
const SCROLLBACK = 2_000_000
const HIGH = 100_000
const LOW = 10_000

function hasDecisions(cwd: string) {
  try {
    return readdirSync(join(cwd, '.decisions')).some((n) => /^D\d+\.md$/.test(n))
  } catch {
    return false
  }
}

export function registerRuns(
  win: BrowserWindow,
  getCwd: () => string | undefined,
  mcpUrl: string,
  focusProject: (path: string) => void,
) {
  const runs: Run[] = []
  let seq = 0
  const sessions = new Map<string, AgentSession>()
  // Last SCROLLBACK chars per Run; `base` counts what was dropped, so offsets stay absolute.
  const scrollback = new Map<string, { text: string; base: number }>()
  // Bytes sent to the renderer and not yet drawn, per watched Run; the session pauses above HIGH.
  const flow = new Map<string, { unacked: number; paused: boolean; pauses: number }>()
  const cwds = new Map<string, string>()
  const pushRuns = () => win.webContents.send('runs:changed', runs)
  const reset = (run: Run) => {
    run.activity = undefined
    run.progress = undefined
  }
  const emit = (id: string, data: string) => {
    const s = scrollback.get(id) ?? { text: '', base: 0 }
    s.text += data
    if (s.text.length > SCROLLBACK) {
      // Cut at a line start so the snapshot never opens mid escape sequence.
      const cut = s.text.indexOf('\n', s.text.length - SCROLLBACK) + 1
      s.base += cut
      s.text = s.text.slice(cut)
    }
    scrollback.set(id, s)
    win.webContents.send('runs:data', { id, data, offset: s.base + s.text.length - data.length })
    const f = flow.get(id)
    if (!f) return
    f.unacked += data.length
    if (!f.paused && f.unacked > HIGH) {
      f.paused = true
      f.pauses++
      sessions.get(id)?.pause()
    }
  }
  const forget = (id: string) => {
    scrollback.delete(id)
    cwds.delete(id)
    flow.delete(id)
  }

  ipcMain.handle('runs:list', () => runs)
  // The renderer keeps one terminal per Run: watching returns the scrollback so far and starts the ack count.
  ipcMain.handle('runs:watch', (_e, id: string) => {
    flow.set(id, { unacked: 0, paused: false, pauses: 0 })
    const s = scrollback.get(id) ?? { text: '', base: 0 }
    return { text: s.text, length: s.base + s.text.length }
  })
  ipcMain.handle('runs:unwatch', (_e, id: string) => {
    if (flow.get(id)?.paused) sessions.get(id)?.resume()
    flow.delete(id)
  })
  ipcMain.handle('runs:ack', (_e, id: string, n: number) => {
    const f = flow.get(id)
    if (!f) return
    f.unacked = Math.max(0, f.unacked - n)
    if (f.paused && f.unacked < LOW) {
      f.paused = false
      sessions.get(id)?.resume()
    }
  })
  // Test hook: how often flow control paused the Run.
  if (process.env.DECISIONS_RUNTIME)
    ipcMain.handle('runs:pauses', (_e, id: string) => flow.get(id)?.pauses ?? 0)
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
    const f = flow.get(id)
    if (f) Object.assign(f, { unacked: 0, paused: false })
    reset(run)
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
          // The session ended by itself (e.g. `exit`): the Run stays, with its scrollback, until closed.
          run.status = code === 0 ? 'stopped' : 'failed'
          reset(run)
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
    run.renamed = true
    pushRuns()
  })
  // Signals the renderer parsed out of the Run's output (see ui/signals.ts).
  ipcMain.handle('runs:signal', (_e, id: string, s: Signal) => {
    const run = runs.find((r) => r.id === id)
    if (!run) return
    if (s.kind === 'title') {
      const title = s.value.replace(/\p{C}/gu, '').trim().slice(0, 80)
      if (run.renamed || !title || title === run.name) return
      run.name = title
    } else if (s.kind === 'activity') run.activity = s.value
    else if (s.kind === 'progress') run.progress = s.value
    else {
      // The agent asks for attention while the human looks elsewhere: an OS notification brings them back.
      if (win.isFocused() || !Notification.isSupported()) return
      const n = new Notification({ title: run.name, body: s.value === '\x07' ? '' : s.value })
      n.on('click', () => {
        win.show()
        win.focus()
        if (run.project) focusProject(run.project)
        win.webContents.send('runs:select', id)
      })
      n.show()
      return
    }
    pushRuns()
  })
  const stop = (id: string) => {
    const run = runs.find((r) => r.id === id)
    if (run?.status !== 'running') return
    run.status = 'stopped'
    reset(run)
    sessions.get(id)?.stop()
    pushRuns()
  }
  ipcMain.handle('runs:stop', (_e, id: string) => stop(id))
  // Closing a Run that is not running removes it and its scrollback.
  ipcMain.handle('runs:close', (_e, id: string) => {
    const run = runs.find((r) => r.id === id)
    if (!run || run.status === 'running') return
    runs.splice(runs.indexOf(run), 1)
    forget(id)
    pushRuns()
  })
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
    /** `notice` is printed in the terminal before the session starts. */
    startRun: (prompt: string, notice?: string) => {
      const id = create()
      if (notice) emit(id, `${notice}\r\n`)
      start(id, prompt)
    },
    /** Project folder the Run was started in. */
    projectOf: (id: string) => cwds.get(id),
    /** A Decision was raised at the Run's cursor: the terminal marks the line. */
    mark: (id: string, decision: string) => win.webContents.send('runs:mark', { id, decision }),
  }
}
