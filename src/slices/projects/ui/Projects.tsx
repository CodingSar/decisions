import { type ReactNode, useEffect, useState } from 'react'
import type { ProjectsState, ProjectTab } from '../model'

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

const invoke = window.api.invoke

// The setup interview is a Claude Code skill from this plugin; without it the Run would only print "unknown command".
const SKILL = 'grill-with-docs'
const INSTALL = 'claude plugin install mattpocock-skills@claude-plugins-official'

function NewProject({
  recent,
  badges,
  onDone,
}: {
  recent: ProjectTab[]
  badges: Record<string, number>
  onDone: () => void
}) {
  const [missing, setMissing] = useState(false)
  const start = async (setup: boolean) => {
    const path = (await invoke('projects:pick', setup)) as string | undefined
    if (!path) return
    if (setup && !(await invoke('agent:has-skill', SKILL, path))) {
      setMissing(true)
      return
    }
    await invoke('projects:open', path, setup)
    onDone()
  }
  return (
    <div className="new-project">
      <h2>Open a project</h2>
      <button
        type="button"
        aria-label="Open existing folder"
        title="Open existing folder"
        data-primary="true"
        onClick={() => start(false)}
      >
        <Icon
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          size={22}
        />
        <strong>Open existing folder</strong>
        <span>Pick a folder. Past Decisions load from .decisions/.</span>
      </button>
      <button
        type="button"
        aria-label="Set up a new project"
        title="Set up a new project"
        onClick={() => start(true)}
      >
        <Icon d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" size={22} />
        <strong>Set up a new project</strong>
        <span>
          Interview me about the project, then write GLOSSARY.md and ADRs into the new folder.
        </span>
      </button>
      {missing ? (
        <p role="alert">
          Needs the {SKILL} skill. In a terminal: <code>{INSTALL}</code>
        </p>
      ) : null}
      {recent.length ? (
        <ul aria-label="Recent">
          {recent.map((r) => (
            <li key={r.path}>
              <button
                type="button"
                aria-label={r.name}
                title={r.path}
                onClick={async () => {
                  await invoke('projects:open', r.path)
                  onDone()
                }}
              >
                <strong>{r.name}</strong>
                <span>{r.path}</span>
                {badges[r.path] ? <span role="status">{badges[r.path]}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

// Project tabs; `children` renders for the active Project (given its folder), the picker for a new tab.
// `badges` is a count per Project folder shown on its tab.
export function Projects({
  children,
  badges = {},
  busy = [],
  onTabs,
  onRecent,
}: {
  children: (active: string) => ReactNode
  badges?: Record<string, number>
  /** Project folders with a running Run; closing one asks first. */
  busy?: string[]
  onTabs?: (paths: string[]) => void
  onRecent?: (paths: string[]) => void
}) {
  const [state, setState] = useState<ProjectsState>({ tabs: [], recent: [] })
  const [adding, setAdding] = useState(false)
  const [closing, setClosing] = useState<string>()

  useEffect(() => onTabs?.(state.tabs.map((t) => t.path)), [state.tabs, onTabs])
  useEffect(() => onRecent?.(state.recent.map((t) => t.path)), [state.recent, onRecent])

  useEffect(() => {
    invoke('projects:list').then((s) => setState(s as ProjectsState))
    return window.api.on('projects:changed', (s: ProjectsState) => setState(s))
  }, [])

  return (
    <>
      <div role="tablist">
        {state.tabs.map((t) => (
          <span key={t.path} className="tab">
            <button
              type="button"
              role="tab"
              aria-selected={!adding && t.path === state.active}
              aria-disabled={!t.available}
              title={
                t.available
                  ? `${t.path}${badges[t.path] ? ` · ${badges[t.path]} pending` : ''}`
                  : `Folder not found: ${t.path}`
              }
              onClick={() => {
                setAdding(false)
                invoke('projects:focus', t.path)
              }}
            >
              {t.name}
              {badges[t.path] ? <span role="status"> {badges[t.path]}</span> : null}
            </button>
            <button
              type="button"
              aria-label={`Close ${t.name}`}
              className="tab-close"
              title="Close"
              onClick={() =>
                busy.includes(t.path) ? setClosing(t.path) : invoke('projects:close', t.path)
              }
            >
              <Icon d="M18 6L6 18M6 6l12 12" size={12} />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="tab-new"
          aria-label="New tab"
          title="New tab"
          onClick={() => setAdding(true)}
        >
          <Icon d="M12 5v14M5 12h14" size={16} />
        </button>
      </div>
      {closing ? (
        <dialog open aria-label="Close project">
          <p>Closing stops its running Runs.</p>
          <button
            type="button"
            aria-label="Confirm"
            title="Confirm"
            onClick={() => {
              invoke('projects:close', closing)
              setClosing(undefined)
            }}
          >
            <Icon d="M5 13l4 4L19 7" />
          </button>
          <button
            type="button"
            aria-label="Cancel"
            title="Cancel"
            onClick={() => setClosing(undefined)}
          >
            <Icon d="M18 6L6 18M6 6l12 12" />
          </button>
        </dialog>
      ) : null}
      {adding || state.tabs.length === 0 ? (
        <NewProject recent={state.recent} badges={badges} onDone={() => setAdding(false)} />
      ) : (
        children(state.active as string)
      )}
    </>
  )
}
