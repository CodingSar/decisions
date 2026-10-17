import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import * as z from 'zod'
import type { DecisionRequest } from './model'

// Capped on purpose: one-line question, 2-4 one-line options.
const input = (scopes: string[], components: string[]) => ({
  agent: z
    .string()
    .max(60)
    .describe('Your name in the agent tree, e.g. "orchestrator > api-agent"'),
  scope: z.string().describe(`Decision Scope, one of: ${scopes.join(', ')}`),
  question: z.string().max(200).describe('One-line question'),
  options: z.array(z.string().max(120)).min(2).max(4).describe('2-4 one-line options'),
  recommended: z.number().int().min(0).describe('Index of your recommended option'),
  components: z
    .array(z.string().max(80))
    .max(20)
    .optional()
    .describe(
      `Optional Components of the architecture this touches${components.length ? `, from: ${components.join(', ')}` : ''}`,
    ),
})

/** Resolves to the reply text the agent receives. `runId` is the last path segment of the MCP URL the agent was started with. */
export type OnDecision = (req: DecisionRequest, runId: string) => Promise<string>

/** Maps the folder of a coding agent started outside the app to a pseudo Run id, or nothing when it is no open Project. */
export type TerminalRun = (dir: string) => string | undefined

// Tried first; another instance (or program) holding it makes the server fall back to a free port.
export const PREFERRED_PORT = 47821

function createMcp(
  onDecision: OnDecision,
  runId: string | undefined,
  dir: string,
  scopes: string[],
  components: string[],
) {
  const mcp = new McpServer({ name: 'decisions', version: '0.0.0' })
  mcp.registerTool(
    'request_decision',
    {
      description: 'Ask the human for a Decision. Blocks until a Verdict is returned.',
      inputSchema: input(scopes, components),
    },
    async (req) => {
      if (runId === undefined) {
        const text = `Open the folder as a Project in the Decisions app first: ${dir}`
        return { isError: true, content: [{ type: 'text', text }] }
      }
      if (req.recommended >= req.options.length) {
        return { isError: true, content: [{ type: 'text', text: 'recommended is out of range' }] }
      }
      return { content: [{ type: 'text', text: await onDecision(req, runId) }] }
    },
  )
  return mcp
}

// Stateless streamable-HTTP MCP endpoint on loopback; one server and transport per request.
// `/mcp/<runId>` serves a Run the app started; plain `/mcp` serves a session started in a terminal, which names its folder in `X-Project-Dir`.
// `scopesOf` names the valid Scopes of the Project a Run works in; the tool schema lists them; `componentsOf` likewise for the Groma Components.
export async function startMcpServer(
  onDecision: OnDecision,
  scopesOf: (runId: string) => string[],
  componentsOf: (runId: string) => string[],
  terminalRun: TerminalRun,
  port = PREFERRED_PORT,
) {
  const http = createServer(async (req, res) => {
    const dir = String(req.headers['x-project-dir'] ?? '')
    const named = (req.url ?? '').split('/').filter(Boolean).at(1)
    const runId = named ?? (dir ? terminalRun(dir) : undefined)
    const mcp = createMcp(
      onDecision,
      runId,
      dir,
      runId ? scopesOf(runId) : [],
      runId ? componentsOf(runId) : [],
    )
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => {
      transport.close()
      mcp.close()
    })
    await mcp.connect(transport)
    await transport.handleRequest(req, res)
  })
  const listen = (p: number) =>
    new Promise<void>((ok, fail) => {
      http.once('error', fail)
      http.listen(p, '127.0.0.1', () => {
        http.off('error', fail)
        ok()
      })
    })
  await listen(port).catch(() => listen(0))
  const url = `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`
  return { url, close: () => http.close() }
}
