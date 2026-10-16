import { type BrowserWindow, ipcMain } from 'electron'
import type { DecisionRequest } from '../../agent-runtimes/main'
import { componentIds } from '../../architecture/main'
import { supersededBy, type Verdict, verdictText } from '../model'
import { create, readAll, remove, write } from '../store'

export interface ScopeRule {
  mine: boolean
  /** Like "30m" or "2h". */
  timeout?: string
}

const toMs = (t: string) => Number.parseInt(t, 10) * (t.endsWith('h') ? 3600_000 : 60_000)

// `projectOf` resolves a Run to the Project folder it works in; `ruleOf` gives the Scope's settings there;
// `mark` tells the Run's terminal where the Decision was raised.
export function registerDecisions(
  win: BrowserWindow,
  projectOf: (runId: string) => string | undefined,
  ruleOf: (project: string, scope: string) => ScopeRule,
  mark: (runId: string, decision: string) => void = () => {},
) {
  // Blocked agent calls, keyed by Project folder and Decision ID. No entry: the agent is gone.
  // `left` is the time to timeout; it only runs down while the app runs and the human is not working on a card.
  const waiting = new Map<
    string,
    { project: string; id: number; reply: (text: string) => void; left?: number }
  >()
  const key = (project: string, id: number) => `${project}#${id}`
  let working = false

  const changed = (project: string) => win.webContents.send('decisions:changed', project)

  function advance(ms: number) {
    if (working) return
    for (const [k, w] of waiting) {
      if (w.left === undefined) continue
      w.left -= ms
      if (w.left > 0) continue
      const d = readAll(w.project).find((x) => x.id === w.id)
      if (!d) {
        w.reply('Decision removed')
        waiting.delete(k)
        changed(w.project)
        continue
      }
      const reply = verdictText(d, { like: true })
      write(w.project, {
        ...d,
        status: 'answered',
        answered: Date.now(),
        by: 'auto',
        reason: 'timeout',
        verdict: reply,
      })
      w.reply(reply)
      waiting.delete(k)
      changed(w.project)
    }
  }
  setInterval(() => advance(1000), 1000).unref()

  ipcMain.handle('decisions:list', (_e, project: string) => readAll(project))
  ipcMain.handle('decisions:working', (_e, on: boolean) => {
    working = on
  })
  // Test hook: the harness cannot wait 30 minutes.
  if (process.env.DECISIONS_RUNTIME) {
    ipcMain.handle('decisions:advance', (_e, minutes: number) => advance(minutes * 60_000))
    // Files written behind the app's back (seeded Decisions, curated groma/) show up on request.
    ipcMain.handle('decisions:touch', (_e, project: string) => changed(project))
  }
  ipcMain.handle('decisions:accept', (_e, project: string, id: number) => {
    const d = readAll(project).find((x) => x.id === id && x.by === 'auto')
    if (!d) return
    write(project, { ...d, accepted: true })
    changed(project)
  })
  // Overturn: a pending copy linked to the old Decision; nothing reaches any agent.
  ipcMain.handle('decisions:overturn', (_e, project: string, id: number) => {
    const all = readAll(project)
    const old = all.find((x) => x.id === id && x.status === 'answered')
    if (!old || supersededBy(all, id)) return
    const { id: _, by, reason, accepted, verdict, answered, ...copy } = old
    create(project, { ...copy, status: 'pending', asked: Date.now(), supersedes: id })
    changed(project)
  })
  // Cancelling an overturn drops its pending Decision.
  ipcMain.handle('decisions:discard', (_e, project: string, id: number) => {
    const d = readAll(project).find((x) => x.id === id)
    if (d?.status !== 'pending' || !d.supersedes) return
    remove(project, id)
    changed(project)
  })
  ipcMain.handle('decisions:verdict', (_e, project: string, id: number, v: Verdict) => {
    const d = readAll(project).find((x) => x.id === id && x.status === 'pending')
    if (!d) return
    const reply = verdictText(d, v)
    write(project, { ...d, status: 'answered', answered: Date.now(), by: 'human', verdict: reply })
    waiting.get(key(project, id))?.reply(reply)
    waiting.delete(key(project, id))
    changed(project)
  })

  return {
    request(req: DecisionRequest, runId: string): Promise<string> {
      const project = projectOf(runId)
      if (!project) return Promise.reject(new Error(`unknown Run ${runId}`))
      // Unknown Component ids are dropped.
      const known = componentIds(project)
      const components = req.components?.filter((c) => known.includes(c))
      req = { ...req, components: components?.length ? components : undefined }
      const rule = ruleOf(project, req.scope)
      if (!rule.mine) {
        const d = create(project, {
          ...req,
          run: runId,
          status: 'answered',
          answered: Date.now(),
          by: 'auto',
          reason: 'out-of-scope',
        })
        const reply = verdictText(d, { like: true })
        write(project, { ...d, verdict: reply })
        mark(runId, `D${d.id}`)
        changed(project)
        return Promise.resolve(reply)
      }
      const d = create(project, { ...req, run: runId, status: 'pending', asked: Date.now() })
      mark(runId, `D${d.id}`)
      changed(project)
      return new Promise((reply) =>
        waiting.set(key(project, d.id), {
          project,
          id: d.id,
          reply,
          left: rule.timeout ? toMs(rule.timeout) : undefined,
        }),
      )
    },
  }
}
