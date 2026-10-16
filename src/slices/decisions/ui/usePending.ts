import { useEffect, useState } from 'react'
import type { Decision } from '../model'

// Pending Decisions per Project folder, oldest first; refetched when main reports a change.
export function usePending(projects: string[]) {
  const [byProject, setByProject] = useState<Record<string, Decision[]>>({})
  const key = projects.join('\n')

  useEffect(() => {
    const open = key.split('\n').filter(Boolean)
    let stale = false
    // Closed Projects drop out.
    setByProject((s) => Object.fromEntries(Object.entries(s).filter(([p]) => open.includes(p))))
    const load = (project: string) =>
      window.api.invoke('decisions:list', project).then((all) => {
        if (stale) return
        const pending = (all as Decision[]).filter((d) => d.status === 'pending')
        setByProject((s) => ({ ...s, [project]: pending }))
      })
    for (const p of open) load(p)
    const off = window.api.on('decisions:changed', (project: string) => {
      if (open.includes(project)) load(project)
    })
    return () => {
      stale = true
      off()
    }
  }, [key])

  return byProject
}
