import { useEffect, useState } from 'react'
import type { Decision } from '../model'

// Pending Decisions per Project folder, oldest first; refetched when main reports a change.
export function usePending(projects: string[]) {
  const [byProject, setByProject] = useState<Record<string, Decision[]>>({})
  const key = projects.join('\n')

  useEffect(() => {
    const load = (project: string) =>
      window.api.invoke('decisions:list', project).then((all) => {
        const pending = (all as Decision[]).filter((d) => d.status === 'pending')
        setByProject((s) => ({ ...s, [project]: pending }))
      })
    for (const p of key.split('\n').filter(Boolean)) load(p)
    return window.api.on('decisions:changed', (project: string) => load(project))
  }, [key])

  return byProject
}
