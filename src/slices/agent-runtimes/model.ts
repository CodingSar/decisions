export interface AgentSession {
  write(data: string): void
  resize(cols: number, rows: number): void
  stop(): void
}

export interface StartOptions {
  cwd: string
  mcpUrl: string
  /** Initial prompt for the session. */
  prompt?: string
  onOutput: (data: string) => void
  onExit: (code: number) => void
}

export interface AgentRuntime {
  /** Throws when the runtime is unavailable (e.g. CLI missing). */
  start(opts: StartOptions): AgentSession
}

export interface DecisionRequest {
  agent: string
  scope: string
  question: string
  options: string[]
  recommended: number
}
