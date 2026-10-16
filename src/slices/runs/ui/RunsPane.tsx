import { useEffect, useState } from 'react'
import type { Run } from '../model'
import { Terminal } from './Terminal'

declare global {
  interface Window {
    api: {
      invoke(channel: string, ...args: unknown[]): Promise<unknown>
      on(channel: string, cb: (payload: never) => void): () => void
    }
  }
}

function Name({ run }: { run: Run }) {
  const [editing, setEditing] = useState(false)
  if (!editing)
    return (
      <h2 className="run-name">
        {run.name !== run.id && <span>{run.id} ·</span>}
        <button
          type="button"
          aria-label="Rename Run"
          title="Rename Run"
          onClick={() => setEditing(true)}
        >
          {run.name}
        </button>
      </h2>
    )
  const done = (name: string) => {
    setEditing(false)
    window.api.invoke('runs:rename', run.id, name)
  }
  return (
    <input
      className="run-name"
      aria-label="Run name"
      defaultValue={run.name}
      // biome-ignore lint/a11y/noAutofocus: the field replaces the name the human just clicked
      autoFocus
      onBlur={(e) => done(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') done(e.currentTarget.value)
        if (e.key === 'Escape') setEditing(false)
      }}
    />
  )
}

// Runs of one Project; `current` is the selected one, else the newest.
export function useRuns(project: string) {
  const [all, setAll] = useState<Run[]>([])
  const [selected, setSelected] = useState<string>()

  useEffect(() => {
    window.api.invoke('runs:list').then((r) => setAll(r as Run[]))
    return window.api.on('runs:changed', (r: Run[]) => setAll([...r]))
  }, [])

  const runs = all.filter((r) => r.project === project)
  const current = runs.find((r) => r.id === selected) ?? runs.at(-1)
  return {
    runs,
    current,
    select: setSelected,
    create: async () => setSelected((await window.api.invoke('runs:create')) as string),
  }
}

// Project folders that have a running Run.
export function useBusy() {
  const [busy, setBusy] = useState<string[]>([])
  useEffect(() => {
    const set = (rs: Run[]) =>
      setBusy(rs.filter((r) => r.status === 'running' && r.project).map((r) => r.project as string))
    window.api.invoke('runs:list').then((r) => set(r as Run[]))
    return window.api.on('runs:changed', (r: Run[]) => set(r))
  }, [])
  return busy
}

type Runs = ReturnType<typeof useRuns>

export function RunList({ runs, current, select, create }: Runs) {
  return (
    <>
      <div className="side-head">
        <span>Runs</span>
        <button type="button" aria-label="New Run" title="New Run (N)" onClick={create}>
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <ul className="runs">
        {runs.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              aria-label={`${r.name} · ${r.status}`}
              aria-current={r.id === current?.id}
              onClick={() => select(r.id)}
            >
              <span className={`dot ${r.status}`} />
              <span className="grow">{r.name}</span>
              <small>{r.id}</small>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

export function RunTerminal({ current }: Pick<Runs, 'current'>) {
  const running = current?.status === 'running'
  return (
    <>
      <div className="term-head">
        {current && <span className={`dot ${current.status}`} />}
        {current && <Name key={current.id} run={current} />}
        <span className="grow" />
        <button
          type="button"
          className="start"
          aria-label="Start"
          title="Start (S)"
          disabled={!current || running}
          onClick={() => current && window.api.invoke('runs:start', current.id)}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 4l14 8-14 8z" />
          </svg>
        </button>
        <button
          type="button"
          className="stop"
          aria-label="Stop"
          title="Stop (X)"
          disabled={!running}
          onClick={() => current && window.api.invoke('runs:stop', current.id)}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x={4} y={4} width={16} height={16} rx={2} />
          </svg>
        </button>
      </div>
      {current && <Terminal runId={current.id} live={running} />}
    </>
  )
}
