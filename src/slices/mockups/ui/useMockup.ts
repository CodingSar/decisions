import { useEffect, useState } from 'react'

export interface MockupFile {
  html: string
  /** The approved Mock-up it replaces, when one exists. */
  before?: string
}

/** The Mock-up's HTML (and its approved predecessor) read from the Project. */
export function useMockup(project: string, rel: string) {
  const [file, setFile] = useState<MockupFile>()
  useEffect(() => {
    let live = true
    window.api
      .invoke('mockups:read', project, rel)
      .then((f) => live && setFile(f as MockupFile | undefined))
    return () => {
      live = false
    }
  }, [project, rel])
  return file
}
