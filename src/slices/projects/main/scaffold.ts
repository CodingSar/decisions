import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { PREFERRED_PORT } from '../../agent-runtimes/main'

const PLUGIN = 'mattpocock-skills@claude-plugins-official'

// Keeps agents from asking in their own terminal while the app is there to ask.
const DECISIONS = `## Decisions
- Ask the human through the \`request_decision\` MCP tool (the Decisions app), not AskUserQuestion. If the tool is missing or errors, ask in the terminal.
`

const skeleton = (name: string) => `# ${name}

## Commands
- Install, test, lint: fill in.

${DECISIONS}
## Tools
- Library docs: Context7 MCP, not memory.
- Tasks: Backlog.md (\`backlog\` CLI, tasks in \`backlog/\`).
- Architecture: Groma (\`groma agent-instructions\`); never edit its files directly.
- Public plugins and docs: Tessl MCP.
- Feature design: the \`grilling\` and \`domain-modeling\` skills (mattpocock-skills).
`

const servers = {
  decisions: {
    type: 'http',
    url: `http://127.0.0.1:${PREFERRED_PORT}/mcp`,
    // Claude Code expands ${PWD}: the app maps the folder to its open Project.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Claude Code expands it, not JS
    headers: { 'X-Project-Dir': '${PWD}' },
  },
  context7: { type: 'http', url: 'https://mcp.context7.com/mcp' },
  tessl: { type: 'stdio', command: 'tessl', args: ['mcp', 'start'] },
}

function readJson(file: string): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

/** Adds the missing keys of `defaults` under `key` in a JSON file; present keys stay as they are. */
function merge(file: string, key: string, defaults: Record<string, unknown>) {
  const json = readJson(file)
  json[key] = { ...defaults, ...json[key] }
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`)
}

/** Prepares a Project folder so coding agents there reach the app; never overwrites. */
export function scaffold(dir: string) {
  merge(join(dir, '.mcp.json'), 'mcpServers', servers)
  merge(join(dir, '.claude', 'settings.json'), 'enabledPlugins', { [PLUGIN]: true })
  const file = join(dir, 'CLAUDE.md')
  if (!existsSync(file)) writeFileSync(file, skeleton(basename(dir)))
  else if (!/^## Decisions$/m.test(readFileSync(file, 'utf8')))
    writeFileSync(file, `${readFileSync(file, 'utf8').trimEnd()}\n\n${DECISIONS}`)
}
