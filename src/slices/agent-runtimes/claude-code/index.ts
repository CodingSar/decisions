import { execFile } from 'node:child_process'
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
      pause: () => pty.pause(),
      resume: () => pty.resume(),
      stop: () => pty.kill(),
    }
  },
}

/** Installs the interview skills for the Project; resolves to the reason when that fails. */
export const installPlugin = (cwd: string) =>
  new Promise<string | undefined>((done) => {
    if (!onPath('claude')) return done('"claude" CLI not found on PATH')
    execFile(
      'claude',
      ['plugin', 'install', 'mattpocock-skills@claude-plugins-official', '--scope', 'project'],
      { cwd, timeout: 60_000 },
      (err, _out, stderr) => done(err ? (stderr || err.message).trim().split('\n')[0] : undefined),
    )
  })
