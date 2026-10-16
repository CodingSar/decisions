import { useCallback, useEffect, useRef, useState } from 'react'
import { Chevron } from '../../../shared/ui/Chevron'
import { FILE, Glyph } from '../../../shared/ui/Glyph'
import type { GitChange, GitStatus } from '../model'

// Status of one Project; refreshes when the file watcher reports a change.
function useStatus(project: string) {
  const [status, setStatus] = useState<GitStatus>()
  const seq = useRef(0)
  // Only the latest request may set the status.
  const reload = useCallback(() => {
    const mine = ++seq.current
    return window.api.invoke('git:status', project).then((s) => {
      if (mine === seq.current) setStatus(s as GitStatus)
    })
  }, [project])
  useEffect(() => {
    reload()
    return window.api.on('files:changed', (p: string) => p === project && reload())
  }, [project, reload])
  return [status, reload] as const
}

const BRANCH =
  'M6 7v10M18 10c0 5-12 2-12 7M8 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'

export function GitSection({
  project,
  run,
  onOpen,
}: {
  project: string
  /** The running Run of this Project, which locks branch switching. */
  run?: { name: string }
  onOpen: (path: string) => void
}) {
  const [status, reload] = useStatus(project)
  const [open, setOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const typed = useRef(message)
  typed.current = message
  // git's stderr goes to the error strip.
  const act = (channel: string, ...args: unknown[]) =>
    window.api
      .invoke(channel, project, ...args)
      .then((r) => {
        const res = r as { ok: boolean; out: string }
        setError(res.ok ? undefined : res.out)
        return reload().then(() => res.ok)
      })
      .catch((e) => {
        setError(String(e?.message ?? e))
        return false
      })
  const staged = status?.changes.filter((c) => c.staged) ?? []
  const commit = () => {
    const sent = message
    setBusy(true)
    act('git:commit', sent)
      .then((ok) => ok && typed.current === sent && setMessage(''))
      .finally(() => setBusy(false))
  }

  const list = (name: string, changes: GitChange[], icon: string, channel: string) =>
    changes.length ? (
      <>
        <h3>{name}</h3>
        <ul aria-label={name} className="tree">
          {changes.map((c) => (
            <li key={c.path}>
              <button type="button" aria-label={c.path} onClick={() => onOpen(c.path)}>
                <Glyph d={FILE} />
                <span>{c.path.split('/').pop()}</span>
              </button>
              <button
                type="button"
                className="act"
                aria-label={`${icon === '+' ? 'Stage' : 'Unstage'} ${c.path}`}
                title={icon === '+' ? 'Stage' : 'Unstage'}
                onClick={() => act(channel, c.path)}
              >
                <Glyph d={icon === '+' ? 'M12 5v14M5 12h14' : 'M5 12h14'} />
              </button>
            </li>
          ))}
        </ul>
      </>
    ) : null

  return (
    <section aria-label="Git" className="git" data-repo={status?.repo}>
      <div className="side-head">
        <button
          type="button"
          aria-label={open ? 'Collapse Git' : 'Expand Git'}
          aria-expanded={open}
          title={open ? 'Collapse Git' : 'Expand Git'}
          onClick={() => setOpen((o) => !o)}
        >
          <Chevron open={open} />
        </button>
        <span>Git</span>
        {status && !status.repo ? (
          <button type="button" onClick={() => act('git:init')}>
            git init
          </button>
        ) : null}
      </div>
      {open && run ? <div role="status">Run {run.name} is active</div> : null}
      {open && error ? <div role="alert">{error}</div> : null}
      {open && status?.repo ? (
        <>
          <div className="branch-row">
            <label
              className="branch"
              title={run ? 'Branch switching is off while a Run is active' : 'Switch branch'}
            >
              <Glyph d={BRANCH} size={13} />
              <select
                aria-label="Branch"
                value={status.branch}
                disabled={!!run}
                onChange={(e) => act('git:checkout', e.target.value)}
              >
                {status.branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <Chevron open />
            </label>
            <button type="button" aria-label="Pull" title="Pull" onClick={() => act('git:pull')}>
              <Glyph d="M12 5v14M19 12l-7 7-7-7" />
            </button>
            <button type="button" aria-label="Push" title="Push" onClick={() => act('git:push')}>
              <Glyph d="M12 19V5M5 12l7-7 7 7" />
            </button>
          </div>
          {list('Staged', staged, '−', 'git:unstage')}
          {list(
            'Changes',
            status.changes.filter((c) => !c.staged),
            '+',
            'git:stage',
          )}
          <div className="commit">
            <input
              aria-label="Commit message"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="button"
              aria-label="Commit"
              title="Commit"
              disabled={busy || !staged.length || !message.trim()}
              onClick={commit}
            >
              <Glyph d="M5 12l5 5L20 7" />
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
