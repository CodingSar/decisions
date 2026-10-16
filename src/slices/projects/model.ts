export interface ProjectTab {
  path: string
  name: string
  available: boolean
}

export interface ProjectsState {
  tabs: ProjectTab[]
  active?: string
  /** Closed Projects, most recent first. */
  recent: ProjectTab[]
}
