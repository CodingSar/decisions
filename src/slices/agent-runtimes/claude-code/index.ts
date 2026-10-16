import { accessSync, constants } from 'node:fs'
import { delimiter, join } from 'node:path'
import { spawn } from '@lydell/node-pty'
import type { AgentRuntime } from '../model'

function onPath(cmd: string) {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    try {
      accessSync(join(dir, cmd), constants.X_OK)
      return true
    } catch {}
  }
  return false
}

// Runs the interactive `claude` CLI in a pty, wired to the app's request_decision MCP server.
export const claudeCodeRuntime: AgentRuntime = {
  start({ cwd, mcpUrl, prompt, onOutput, onExit }) {
    if (!onPath('claude')) throw new Error('"claude" CLI not found on PATH')
    const mcpConfig = JSON.stringify({ mcpServers: { decisions: { type: 'http', url: mcpUrl } } })
    // Prompt first: --mcp-config is variadic and would swallow a trailing prompt as a config path.
    const pty = spawn('claude', [...(prompt ? [prompt] : []), '--mcp-config', mcpConfig], {
      cwd,
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      // A Decision may wait for the human for hours; HTTP MCP calls otherwise time out after 60 s.
      env: { ...process.env, MCP_TOOL_TIMEOUT: '86400000' } as Record<string, string>,
    })
    pty.onData(onOutput)
    pty.onExit(({ exitCode }) => onExit(exitCode))
    return {
      write: (data) => pty.write(data),
      resize: (cols, rows) => pty.resize(cols, rows),
      stop: () => pty.kill(),
    }
  },
}
