export type RunStatus = 'idle' | 'running' | 'stopped' | 'failed'

export interface Run {
  id: string
  name: string
  status: RunStatus
  /** Project folder the Run belongs to; set when created. */
  project?: string
}
