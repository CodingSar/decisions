import { claudeCodeRuntime, installPlugin } from '../claude-code'
import { fakeRuntime } from '../fake'
import type { AgentRuntime } from '../model'

export { PREFERRED_PORT, startMcpServer } from '../mcp'
export type {
  AgentRuntime,
  AgentSession,
  DecisionRequest,
  InformRequest,
  StartOptions,
} from '../model'

export type RuntimeKind = 'claude-code' | 'fake'

const runtimes: Record<RuntimeKind, AgentRuntime> = {
  'claude-code': claudeCodeRuntime,
  fake: fakeRuntime,
}

// Claude Code is the only user-facing entry; the fake is test-only (selected by env or setRuntime).
let current: RuntimeKind = process.env.DECISIONS_RUNTIME === 'fake' ? 'fake' : 'claude-code'

export const setRuntime = (kind: RuntimeKind) => {
  current = kind
}
export const getRuntime = () => runtimes[current]

/** Installs the plugin the setup interview needs; resolves to why it failed. The fake needs none. */
export const ensurePlugin = (cwd: string) =>
  current === 'fake' ? Promise.resolve(undefined) : installPlugin(cwd)
