import { useEffect, useState } from 'react'
import type { Run } from '../model'
import { Terminal } from './Terminal'

// The dot and label follow the agent's own report while it runs: amber while it waits for the human.
const tone = (r: Run) => (r.status === 'running' && r.activity ? r.activity : r.status)
const label = (r: Run) =>
  `${r.name} · ${r.status === 'running' && r.activity === 'waiting' ? 'waiting' : r.status}`

declare global {
  interface Window {
    api: {
      env: { renderer?: string; test: boolean }
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

// All Runs, kept live.
function useAllRuns() {
  const [all, setAll] = useState<Run[]>([])
  useEffect(() => {
    window.api.invoke('runs:list').then((r) => setAll(r as Run[]))
    return window.api.on('runs:changed', (r: Run[]) => setAll([...r]))
  }, [])
  return all
}

// Runs of one Project; `current` is the selected one, else the newest.
export function useRuns(project: string) {
  const all = useAllRuns()
  const [selected, setSelected] = useState<string>()

  // A notification click or a Decision card selects a Run from outside the list.
  useEffect(() => window.api.on('runs:select', (id: string) => setSelected(id)), [])

  const runs = all.filter((r) => r.project === project)
  const current = runs.find((r) => r.id === selected) ?? runs.at(-1)
  return {
    runs,
    current,
    select: setSelected,
    create: () =>
      window.api
        .invoke('runs:create')
        .then((id) => setSelected(id as string))
        .catch(console.error),
    // Create and start in one go: the terminal placeholder's Run button.
    run: async () => {
      try {
        const id = (await window.api.invoke('runs:create')) as string
        setSelected(id)
        await window.api.invoke('runs:start', id)
      } catch (e) {
        console.error(e)
      }
    },
  }
}

// Project folders that have a running Run.
export function useBusy() {
  return useAllRuns()
    .filter((r) => r.status === 'running' && r.project)
    .map((r) => r.project as string)
}

type Runs = ReturnType<typeof useRuns>

export function RunList({ runs, current, select, create }: Runs) {
  return (
    <>
      <div className="side-head">
        <span>Runs</span>
        <button type="button" aria-label="New Run" title="New Run (⌘N)" onClick={create}>
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
              aria-label={label(r)}
              title={label(r)}
              aria-current={r.id === current?.id}
              onClick={() => select(r.id)}
            >
              <span className={`dot ${tone(r)}`} />
              <span className="grow">{r.name}</span>
              {r.name !== r.id && <small>{r.id}</small>}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

// Stands in for the terminal while there is nothing to show: a line and one play button.
function Placeholder({ text, title, onRun }: { text: string; title: string; onRun: () => void }) {
  return (
    <div className="term-empty">
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 17l6-5-6-5M12 19h8" />
      </svg>
      <p>{text}</p>
      <button type="button" className="run" aria-label="Run" title={title} onClick={onRun}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 4l14 8-14 8z" />
        </svg>
      </button>
    </div>
  )
}

export function RunTerminal({ current, run }: Pick<Runs, 'current' | 'run'>) {
  const running = current?.status === 'running'
  if (!current)
    return (
      <>
        <div className="term-head">
          <span className="dot" />
          <span className="muted">Terminal</span>
        </div>
        <Placeholder text="No Run yet" title="Start a Run (⌘N)" onRun={run} />
      </>
    )
  const idle = current.status === 'idle'
  const start = () => window.api.invoke('runs:start', current.id).catch(console.error)
  return (
    <>
      <div className="term-head">
        <span className={`dot ${tone(current)}`} />
        <Name key={current.id} run={current} />
        {running && current.activity === 'waiting' && (
          <span className="chip waiting" title="Waiting for your input">
            waiting
          </span>
        )}
        <span className="grow" />
        <button
          type="button"
          className="find"
          aria-label="Find"
          title="Find (⌘F)"
          disabled={idle}
          onClick={() => window.dispatchEvent(new Event('terminal:find'))}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx={11} cy={11} r={7} />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </button>
        <button
          type="button"
          className="start"
          aria-label="Start"
          title="Start (⌘S)"
          disabled={running}
          onClick={start}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 4l14 8-14 8z" />
          </svg>
        </button>
        {running ? (
          <button
            type="button"
            className="stop"
            aria-label="Stop"
            title="Stop (⌘X)"
            onClick={() => window.api.invoke('runs:stop', current.id).catch(console.error)}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x={4} y={4} width={16} height={16} rx={2} />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="stop"
            aria-label="Close"
            title="Close (⌘X)"
            onClick={() => window.api.invoke('runs:close', current.id).catch(console.error)}
          >
            <svg
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
      {running && current.progress !== undefined && (
        <div
          className="term-progress"
          role="progressbar"
          aria-label="Progress"
          aria-valuenow={current.progress}
          style={{ width: `${current.progress}%` }}
        />
      )}
      {idle ? (
        <Placeholder text={`${current.name} not started`} title="Start (⌘S)" onRun={start} />
      ) : (
        <Terminal key={current.id} runId={current.id} live={running} />
      )}
    </>
  )
}
