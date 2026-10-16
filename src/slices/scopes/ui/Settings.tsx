import { useEffect, useState } from 'react'
import { isSeeded, isTimeout, type ScopeSetting } from '../model'

const invoke = window.api.invoke

// Per-Project settings modal; Decision Scopes is its first section.
export function Settings({ project, onClose }: { project: string; onClose: () => void }) {
  const [scopes, setScopes] = useState<ScopeSetting[]>([])

  useEffect(() => {
    invoke('scopes:get', project).then((s) => setScopes(s as ScopeSetting[]))
  }, [project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = (next: ScopeSetting[]) => {
    setScopes(next)
    invoke('scopes:set', project, next)
  }
  const patch = (name: string, change: Partial<ScopeSetting>) =>
    save(scopes.map((s) => (s.name === name ? { ...s, ...change } : s)))

  return (
    <dialog open aria-label="Project settings" className="settings">
      <header>
        <span className="grow">{project.split('/').pop()} · settings</span>
        <button type="button" aria-label="Close" title="Close (Esc)" onClick={onClose}>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <h2>Decision Scopes</h2>
      {scopes.map((s) => (
        <div key={s.name} className={s.mine ? 'scope' : 'scope off'}>
          <input
            type="checkbox"
            role="switch"
            aria-label={s.name}
            title={s.mine ? 'Mine' : 'Not mine: auto-resolved'}
            checked={s.mine}
            aria-checked={s.mine}
            onChange={(e) => patch(s.name, { mine: e.target.checked })}
          />
          <span className="grow">{s.name}</span>
          <input
            key={s.timeout}
            aria-label={`Timeout ${s.name}`}
            title="Timeout before an in-Scope Decision auto-resolves"
            defaultValue={s.timeout ?? 'none'}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (isTimeout(v)) patch(s.name, { timeout: v })
              else patch(s.name, { timeout: undefined })
              if (!isTimeout(v)) e.target.value = 'none'
            }}
          />
          {isSeeded(s.name) ? null : (
            <button
              type="button"
              aria-label={`Delete ${s.name}`}
              title="Delete Scope"
              onClick={() => save(scopes.filter((x) => x.name !== s.name))}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <input
        aria-label="Add Scope"
        title="Add Scope (N)"
        placeholder="+ Add Scope"
        onKeyDown={(e) => {
          const name = e.currentTarget.value.trim()
          if (e.key !== 'Enter' || !name) return
          if (!scopes.some((s) => s.name.toLowerCase() === name.toLowerCase()))
            save([...scopes, { name, mine: true }])
          e.currentTarget.value = ''
        }}
      />
    </dialog>
  )
}
