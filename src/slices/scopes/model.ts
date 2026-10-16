export interface ScopeSetting {
  name: string
  mine: boolean
  /** Like "30m" or "2h"; absent means none. */
  timeout?: string
}

export const SEEDED = [
  'Architecture',
  'UI',
  'UX',
  'Data model',
  'Dependencies',
  'Security',
  'Testing strategy',
  'Scope and requirements',
  'Naming and domain language',
  'Performance',
  'Cost/irreversibility',
]

export const isSeeded = (name: string) => SEEDED.includes(name)

export const isTimeout = (s: string) => /^\d+[mh]$/.test(s)

/** Seeded Scopes (all mine unless the stored config says otherwise) followed by the user-added ones. */
export function withSeeded(stored: ScopeSetting[]): ScopeSetting[] {
  const seeded = SEEDED.map((name) => stored.find((s) => s.name === name) ?? { name, mine: true })
  return [...seeded, ...stored.filter((s) => !isSeeded(s.name))]
}
