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
  mockup: z
    .string()
    .max(200)
    .optional()
    .describe(
      'For impactful UI changes: project-relative path of a self-contained HTML Mock-up you wrote first, named docs/mock/<name>-for-approval.html (1440x900). On approval the app renames it <name>-approved.html; otherwise revise it in place and ask again. Verdicts may carry Marks: lines like `remove: button "Sort"`.',
    ),
})

/** Resolves to the reply text the agent receives. `runId` is the last path segment of the MCP URL the agent was started with. */
export type OnDecision = (req: DecisionRequest, runId: string) => Promise<string>

function createMcp(onDecision: OnDecision, runId: string, scopes: string[], components: string[]) {
  const mcp = new McpServer({ name: 'decisions', version: '0.0.0' })
  mcp.registerTool(
    'request_decision',
    {
      description: 'Ask the human for a Decision. Blocks until a Verdict is returned.',
      inputSchema: input(scopes, components),
    },
    async (req) => {
      if (req.recommended >= req.options.length) {
        return { isError: true, content: [{ type: 'text', text: 'recommended is out of range' }] }
      }
      return { content: [{ type: 'text', text: await onDecision(req, runId) }] }
    },
  )
  return mcp
}

// Stateless streamable-HTTP MCP endpoint on loopback; one server and transport per request.
// `scopesOf` names the valid Scopes of the Project a Run works in; the tool schema lists them; `componentsOf` likewise for the Groma Components.
export async function startMcpServer(
  onDecision: OnDecision,
  scopesOf: (runId: string) => string[],
  componentsOf: (runId: string) => string[],
) {
  const http = createServer(async (req, res) => {
    const runId = (req.url ?? '').split('/').filter(Boolean).at(1) ?? ''
    const mcp = createMcp(onDecision, runId, scopesOf(runId), componentsOf(runId))
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => {
      transport.close()
      mcp.close()
    })
    await mcp.connect(transport)
    await transport.handleRequest(req, res)
  })
  await new Promise<void>((ok) => http.listen(0, '127.0.0.1', ok))
  const url = `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`
  return { url, close: () => http.close() }
}
