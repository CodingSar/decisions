import { useEffect, useState } from 'react'
import { keysBlocked } from '../../shared/ui/keys'
import { DecisionMap } from '../../slices/architecture'
import { Feed, History, Review, ReviewBadge, useAll, usePending } from '../../slices/decisions'
import { FilesView, FileTree } from '../../slices/files'
import { Projects } from '../../slices/projects'
import { RunList, RunTerminal, showDecision, useBusy, useRuns } from '../../slices/runs'
import { Settings } from '../../slices/scopes'
import { useFocus } from './focus'
import { columns, MOD, Pane, useLayout } from './Panes'
import './shell.css'

// `key`: the shortcut shown in the tooltip; a single letter also switches the view on its own.
const VIEWS = [
  { id: 'feed', name: 'Feed', key: 'F', d: 'M4 6h16M4 12h16M4 18h16' },
  { id: 'review', name: 'Review', key: 'R', d: 'M5 13l4 4L19 7' },
  { id: 'history', name: 'History', key: 'H', d: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2' },
  {
    id: 'files',
    name: 'Files',
    key: `${MOD}⇧E`,
    d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  },
] as const

const GEAR =
  'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'

function Icon({ d, children }: { d?: string; children?: React.ReactNode }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d ? <path d={d} /> : children}
    </svg>
  )
}

// The panes of one Project: sidebar (Runs), main (Feed/Review/History), terminal.
function Workspace({
  active,
  paths,
  pending,
}: {
  active: string
  paths: string[]
  pending: ReturnType<typeof usePending>[string]
}) {
  const [view, setView] = useState<'feed' | 'review' | 'history' | 'files'>('feed')
  const [file, setFile] = useState<string>()
  const openFile = (path: string) => {
    setFile(path)
    setView('files')
  }
  const [settings, setSettings] = useState(false)
  const [newestFirst, setNewestFirst] = useState(false)
  // The Decision to land on: an overturn's new copy in the Feed, or one opened from the map.
  // A fresh object each time, so opening the same one again focuses it again.
  const [focus, setFocus] = useState<{ id: number }>()
  const open = (id: number, v: 'feed' | 'history') => {
    setFocus({ id })
    setView(v)
  }
  const overturned = (id: number) => open(id, 'feed')
  const runs = useRuns(active)
  const all = useAll(active)
  useFocus(paths, active)
  const { layout, update } = useLayout()

  // Modifier combos work from anywhere, even while typing in the terminal: ⌘N/⌘S/⌘X act on Runs.
  // Plain letters switch views and sort, and stop while typing.
  useEffect(() => {
    const unit = () =>
      document.activeElement?.closest('[data-focus-unit]')?.getAttribute('data-focus-unit')
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && k === 'e') {
        e.preventDefault()
        return setView('files')
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const { current } = runs
        if (k === 'j' || k === 'b') {
          e.preventDefault()
          update(k === 'j' ? 'terminal' : 'sidebar', (s) => ({ hidden: !s.hidden }))
        } else if (k === 'f' && unit() === 'terminal') {
          e.preventDefault()
          window.dispatchEvent(new Event('terminal:find'))
        } else if (k === 'n') {
          e.preventDefault()
          // With no Run yet, ⌘N starts one, as the placeholder promises.
          runs.runs.length === 0 ? runs.run() : runs.create()
        } else if (k === 's' && current && current.status !== 'running') {
          e.preventDefault()
          window.api.invoke('runs:start', current.id).catch(console.error)
        } else if (k === 'x' && current) {
          e.preventDefault()
          // ⌘X stops a running Run and closes any other.
          window.api
            .invoke(current.status === 'running' ? 'runs:stop' : 'runs:close', current.id)
            .catch(console.error)
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || keysBlocked(e)) return
      if (e.key === ',') return setSettings((o) => !o)
      if (k === 's') return setNewestFirst((o) => !o)
      const v = VIEWS.find((x) => x.key.toLowerCase() === k)
      if (v) setView(v.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [runs, update])

  // Scrollbars show only while their element scrolls.
  useEffect(() => {
    const timers = new Map<Element, number>()
    const onScroll = (e: Event) => {
      if (!(e.target instanceof Element)) return
      const el = e.target
      el.classList.add('scrolling')
      clearTimeout(timers.get(el))
      timers.set(
        el,
        window.setTimeout(() => el.classList.remove('scrolling'), 500),
      )
    }
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      for (const t of timers.values()) clearTimeout(t)
      timers.clear()
    }
  }, [])

  const running = runs.runs.find((r) => r.status === 'running')
  if (!layout) return null
  return (
    <div className="panes" style={{ gridTemplateColumns: columns(layout) }}>
      <Pane side="sidebar" state={layout.sidebar} onChange={(p) => update('sidebar', p)}>
        <aside aria-label="Sidebar" data-focus-unit="sidebar" tabIndex={-1}>
          <RunList {...runs} />
          <FileTree project={active} onOpen={openFile} />
          <button
            type="button"
            className="gear"
            aria-label="Project settings"
            title="Project settings (,)"
            onClick={() => setSettings(true)}
          >
            <Icon>
              <circle cx={12} cy={12} r={3} />
              <path d={GEAR} />
            </Icon>
          </button>
        </aside>
      </Pane>
      <main>
        <div className="views">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-label={v.name}
              aria-pressed={view === v.id}
              title={`${v.name} (${v.key})`}
              onClick={() => setView(v.id)}
            >
              {v.id === 'history' || v.id === 'files' ? (
                <Icon d={v.d} />
              ) : (
                <>
                  {v.name}
                  {v.id === 'review' ? (
                    <ReviewBadge project={active} />
                  ) : pending.length ? (
                    <span role="status">{pending.length}</span>
                  ) : null}
                </>
              )}
            </button>
          ))}
          {view === 'feed' ? (
            <button
              type="button"
              className="sort"
              aria-label={newestFirst ? 'Newest first' : 'Oldest first'}
              title={`${newestFirst ? 'Newest first' : 'Oldest first'} (S)`}
              onClick={() => setNewestFirst((o) => !o)}
            >
              <Icon d={newestFirst ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'} />
            </button>
          ) : null}
        </div>
        {view === 'feed' ? (
          <Feed
            project={active}
            pending={pending}
            runIds={runs.runs.map((r) => r.id)}
            focus={focus}
            newestFirst={newestFirst}
            onShowRun={(d) => {
              if (!d.run) return
              runs.select(d.run)
              update('terminal', { hidden: false })
              // After the switch has rendered, so the viewport is the shown terminal's.
              requestAnimationFrame(() => showDecision(d.run as string, `D${d.id}`))
            }}
          />
        ) : view === 'files' ? (
          <FilesView project={active} path={file} run={running} onOpen={openFile} />
        ) : view === 'review' ? (
          <Review project={active} onOverturn={overturned} />
        ) : (
          <History project={active} focus={focus} onOverturn={overturned} />
        )}
      </main>
      <Pane side="terminal" state={layout.terminal} onChange={(p) => update('terminal', p)}>
        <section aria-label="Terminal pane" data-focus-unit="terminal" tabIndex={-1}>
          <RunTerminal current={runs.current} run={runs.run} />
          <DecisionMap
            project={active}
            decisions={all}
            onOpen={(d) => open(d.id, d.status === 'pending' ? 'feed' : 'history')}
          />
        </section>
      </Pane>
      {settings ? <Settings project={active} onClose={() => setSettings(false)} /> : null}
    </div>
  )
}

export function App() {
  const [paths, setPaths] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const pending = usePending([...paths, ...recent])
  const busy = useBusy()
  const badges = Object.fromEntries(Object.entries(pending).map(([p, d]) => [p, d.length]))

  return (
    <>
      <h1>Decisions</h1>
      <Projects badges={badges} busy={busy} onTabs={setPaths} onRecent={setRecent}>
        {(active) => <Workspace active={active} paths={paths} pending={pending[active] ?? []} />}
      </Projects>
    </>
  )
}
