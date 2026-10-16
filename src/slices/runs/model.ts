export type RunStatus = 'idle' | 'running' | 'stopped' | 'failed'
/** What the agent reports about itself (OSC 7501): busy, blocked on the human, or finished its turn. */
export type Activity = 'working' | 'waiting' | 'done'

export interface Run {
  id: string
  name: string
  status: RunStatus
  /** Project folder the Run belongs to; set when created. */
  project?: string
  activity?: Activity
  /** 0-100 from OSC 9;4. */
  progress?: number
  /** The human renamed it: terminal titles no longer rename it. */
  renamed?: boolean
}

/** Signals the terminal parses out of the Run's output. */
export type Signal =
  | { kind: 'title'; value: string }
  | { kind: 'activity'; value: Activity }
  | { kind: 'progress'; value?: number }
  | { kind: 'notify'; value: string }
