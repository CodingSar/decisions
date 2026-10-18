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
}

export interface DecisionRequest {
  agent: string
  scope: string
  question: string
  options: string[]
  recommended: number
  /** Groma Component ids the Decision touches. */
  components?: string[]
  /** Project-relative path of a Mock-up named `*-for-approval.html` (ADR 0010). */
  mockup?: string
  /** `soft`: park the Decision and carry on with the recommendation (default `hard`: wait for the Verdict). */
  blocking?: 'hard' | 'soft'
}

/** An action the agent took without asking; it lands in Review. */
export interface InformRequest {
  agent: string
  scope: string
  /** What was done. */
  summary: string
  /** Why it needed no human. */
  reason: string
  components?: string[]
}
