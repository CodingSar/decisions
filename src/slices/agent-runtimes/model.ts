export interface AgentSession {
  write(data: string): void
  resize(cols: number, rows: number): void
  /** Flow control: hold output while the renderer catches up. */
  pause(): void
  resume(): void
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
  /** Whether `/name` resolves for a session in `cwd` (a user, project or plugin skill/command). */
  hasSkill(name: string, cwd: string): boolean
}

export interface DecisionRequest {
  agent: string
  scope: string
  question: string
  options: string[]
  recommended: number
  /** Groma Component ids the Decision touches. */
  components?: string[]
}
