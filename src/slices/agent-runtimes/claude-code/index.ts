import { spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import { spawn } from '@lydell/node-pty'
import type { AgentRuntime } from '../model'

// A Dock-launched app gets a bare PATH; ask the login shell for the user's (nvm, Homebrew, ...).
function loginPath() {
  const own = process.env.PATH ?? ''
  if (process.platform === 'win32') return own
  const shell = process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash')
  const res = spawnSync(shell, ['-ilc', 'echo "$PATH"'], { encoding: 'utf8', timeout: 3000 })
  // rc files may chat on stdout; our echo is the last line.
  const found = res.status === 0 ? res.stdout.trim().split('\n').at(-1) : undefined
  if (!found) return own
  return [...new Set([...found.split(delimiter), ...own.split(delimiter)])].join(delimiter)
}

let path: string | undefined

function onPath(cmd: string) {
  path ??= loginPath()
  for (const dir of path.split(delimiter)) {
    try {
      accessSync(join(dir, cmd), constants.X_OK)
      return join(dir, cmd)
    } catch {}
  }
  return undefined
}

// `<name>/SKILL.md` or `commands/<name>.md` anywhere under `dir`, a few levels deep (plugins nest skills).
function provides(dir: string, name: string, depth: number): boolean {
  if (existsSync(join(dir, name, 'SKILL.md')) || existsSync(join(dir, 'commands', `${name}.md`)))
    return true
  if (!depth) return false
  try {
    return readdirSync(dir, { withFileTypes: true }).some(
      (e) =>
        e.isDirectory() && !e.name.startsWith('.') && provides(join(dir, e.name), name, depth - 1),
    )
  } catch {
    return false
  }
}

// Where Claude Code keeps installed plugins: every `installPath` in installed_plugins.json, plus claude.ai-synced ones.
function pluginDirs(root: string) {
  const dirs = [join(root, 'synced')]
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect)
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v))
        if (k === 'installPath' && typeof x === 'string') dirs.push(x)
        else collect(x)
  }
  try {
    collect(JSON.parse(readFileSync(join(root, 'installed_plugins.json'), 'utf8')))
  } catch {}
  return dirs
}

// Filesystem only, no CLI call: skills and commands of the project, the user and installed plugins.
export function hasSkill(name: string, cwd: string) {
  const home = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
  const plugins = process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR || join(home, 'plugins')
  return [join(cwd, '.claude'), home, ...pluginDirs(plugins)].some((d) => provides(d, name, 4))
}

// Runs the interactive `claude` CLI in a pty, wired to the app's request_decision MCP server.
export const claudeCodeRuntime: AgentRuntime = {
  hasSkill,
  start({ cwd, mcpUrl, prompt, onOutput, onExit }) {
    const claude = onPath('claude')
    if (!claude)
      throw new Error(
        '"claude" CLI not found on PATH. Install Claude Code (npm i -g @anthropic-ai/claude-code), then press Start (⌘S).',
      )
    const mcpConfig = JSON.stringify({ mcpServers: { decisions: { type: 'http', url: mcpUrl } } })
    // Prompt first: --mcp-config is variadic and would swallow a trailing prompt as a config path.
    const pty = spawn(claude, [...(prompt ? [prompt] : []), '--mcp-config', mcpConfig], {
      cwd,
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      // A Decision may wait for the human for hours; HTTP MCP calls otherwise time out after 60 s.
      env: { ...process.env, PATH: path, MCP_TOOL_TIMEOUT: '86400000' } as Record<string, string>,
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
