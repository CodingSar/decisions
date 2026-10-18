import { type BrowserWindow, ipcMain } from 'electron'
import type { DecisionRequest, InformRequest } from '../../agent-runtimes/main'
import { componentIds } from '../../architecture/main'
import { approveMockup, MOCKUP_RULE, validMockup } from '../../mockups/main'
import {
  approves,
  checkText,
  type Decision,
  supersededBy,
  unseenLine,
  type Verdict,
  verdictText,
} from '../model'
import { create, readAll, remove, write } from '../store'

export interface ScopeRule {
  mine: boolean
  /** Like "30m" or "2h". */
  timeout?: string
}

const INFORM_CAP = 20
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
  // Inform times per Run, for the hourly cap.
  const informed = new Map<string, number[]>()

  const changed = (project: string) => win.webContents.send('decisions:changed', project)
  // Every Verdict lands in the file; an approving one also promotes the Mock-up (ADR 0010).
  const settle = (project: string, d: Decision, reply: string) => {
    write(project, { ...d, verdict: reply })
    if (d.mockup && approves(reply)) approveMockup(project, d.mockup)
  }

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
      settle(
        w.project,
        { ...d, status: 'answered', answered: Date.now(), by: 'auto', reason: 'timeout' },
        reply,
      )
      w.reply(reply)
      waiting.delete(k)
      changed(w.project)
    }
  }
  setInterval(() => advance(1000), 1000).unref()

  ipcMain.handle('decisions:list', (_e, project: string) => readAll(project))
  // Pending Decisions nobody waits for (agent gone, app restarted): the Verdict only reaches a later Run.
  ipcMain.handle('decisions:orphans', (_e, project: string) =>
    readAll(project)
      .filter((d) => d.status === 'pending' && !d.soft && !waiting.has(key(project, d.id)))
      .map((d) => d.id),
  )
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
  // Overturn: a pending copy linked to the old Decision; nothing reaches any agent. Returns the copy's id.
  ipcMain.handle('decisions:overturn', (_e, project: string, id: number) => {
    const all = readAll(project)
    const old = all.find((x) => x.id === id && x.status === 'answered')
    if (!old || supersededBy(all, id)) return
    if (all.some((x) => x.supersedes === id && x.status === 'pending')) return
    const { id: _, by, reason, accepted, verdict, answered, soft, undelivered, ...copy } = old
    const d = create(project, { ...copy, status: 'pending', asked: Date.now(), supersedes: id })
    changed(project)
    return d.id
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
    const waiter = waiting.get(key(project, id))
    const verdict = {
      ...d,
      status: 'answered' as const,
      answered: Date.now(),
      by: 'human' as const,
    }
    settle(project, waiter ? verdict : { ...verdict, undelivered: true }, reply)
    waiter?.reply(reply)
    waiting.delete(key(project, id))
    changed(project)
  })

  return {
    // Startup line for a new Run in `project`; the Verdicts it lists count as delivered.
    unseen(project: string): string | undefined {
      const unseen = readAll(project).filter((d) => d.undelivered)
      if (!unseen.length) return
      for (const d of unseen) write(project, { ...d, undelivered: undefined })
      changed(project)
      return unseenLine(unseen)
    },
    // `check_decisions`: the Verdicts this Run's agent has not seen yet; they count as delivered.
    check(runId: string): string {
      const project = projectOf(runId)
      if (!project) return checkText([])
      const unseen = readAll(project).filter((d) => d.undelivered && d.run === runId)
      for (const d of unseen) write(project, { ...d, undelivered: undefined })
      if (unseen.length) changed(project)
      return checkText(unseen)
    },
    // `inform`: an answered, auto-resolved Decision straight into Review, capped per Run.
    inform(req: InformRequest, runId: string) {
      const project = projectOf(runId)
      if (!project) throw new Error(`unknown Run ${runId}`)
      const now = Date.now()
      const recent = (informed.get(runId) ?? []).filter((t) => now - t < 3600_000)
      if (recent.length >= INFORM_CAP)
        throw new Error('Too many informs this hour: ask with request_decision instead')
      informed.set(runId, [...recent, now])
      const known = componentIds(project)
      const components = req.components?.filter((c) => known.includes(c))
      const { summary, reason, ...rest } = req
      const d = create(project, {
        ...rest,
        components: components?.length ? components : undefined,
        question: summary,
        options: [reason],
        recommended: 0,
        run: runId,
        status: 'answered',
        answered: now,
        by: 'auto',
        reason: 'informed',
        verdict: `Informed: ${reason}`,
      })
      mark(runId, `D${d.id}`)
      changed(project)
    },
    request(req: DecisionRequest, runId: string, gone?: AbortSignal): Promise<string> {
      const project = projectOf(runId)
      if (!project) return Promise.reject(new Error(`unknown Run ${runId}`))
      // Unknown Component ids are dropped.
      const known = componentIds(project)
      const components = req.components?.filter((c) => known.includes(c))
      req = { ...req, components: components?.length ? components : undefined }
      if (req.mockup !== undefined && !validMockup(project, req.mockup))
        return Promise.reject(new Error(MOCKUP_RULE))
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
        settle(project, d, reply)
        mark(runId, `D${d.id}`)
        changed(project)
        return Promise.resolve(reply)
      }
      const { blocking, ...ask } = req
      const soft = blocking === 'soft'
      const d = create(project, {
        ...ask,
        run: runId,
        status: 'pending',
        asked: Date.now(),
        soft: soft || undefined,
      })
      mark(runId, `D${d.id}`)
      changed(project)
      if (soft)
        return Promise.resolve(
          `Parked D${d.id}; proceed on option ${d.recommended + 1} (recommended). Fetch the Verdict later with check_decisions.`,
        )
      return new Promise((reply) => {
        waiting.set(key(project, d.id), {
          project,
          id: d.id,
          reply,
          left: rule.timeout ? toMs(rule.timeout) : undefined,
        })
        // The agent hung up (Run stopped, crashed): the card stays, its Verdict goes to the next Run.
        gone?.addEventListener('abort', () => {
          if (waiting.delete(key(project, d.id))) changed(project)
        })
      })
    },
  }
}
