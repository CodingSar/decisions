import { useEffect, useState } from 'react'
import type { Decision } from '../model'

// Every Decision of a Project, newest first; refetched when main reports a change.
export function useAll(project: string) {
  const [all, setAll] = useState<Decision[]>([])
  useEffect(() => {
    const load = () =>
      window.api.invoke('decisions:list', project).then((l) => setAll((l as Decision[]).reverse()))
    load()
    return window.api.on('decisions:changed', (p: string) => p === project && load())
  }, [project])
  return all
}
