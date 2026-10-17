import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Page } from '@playwright/test'

export interface Ask {
  settled: boolean
  result?: string
  error?: string
  client: Client
}

// Per-scenario state: the fake agent's blocked request_decision calls.
export const asks = new WeakMap<Page, Ask[]>()

export const QUESTION = 'Which storage for decisions?'
export const OPTIONS = ['Plain files', 'SQLite']

// The fake agent is a real MCP client on the Run's endpoint.
export async function request(
  page: Page,
  runId: string,
  agent: string,
  scope: string,
  recommended = 0,
  components?: string[],
  mockup?: string,
) {
  await ask(page, `/${runId}`, {}, agent, scope, recommended, components, mockup)
}

// A coding agent started in `dir` outside the app: no Run, the folder travels in a header.
export const requestFromTerminal = (page: Page, dir: string, agent: string, scope: string) =>
  ask(page, '', { 'X-Project-Dir': dir }, agent, scope, 0)

async function ask(
  page: Page,
  path: string,
  headers: Record<string, string>,
  agent: string,
  scope: string,
  recommended: number,
  components?: string[],
  mockup?: string,
) {
  const base = (await page.evaluate(() => window.api.invoke('agent:mcp-url'))) as string
  const client = new Client({ name: 'fake-agent', version: '0.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${base}${path}`), { requestInit: { headers } }),
  )
  const pending: Ask = { settled: false, client }
  asks.set(page, [...(asks.get(page) ?? []), pending])
  client
    .callTool(
      {
        name: 'request_decision',
        arguments: {
          agent,
          scope: scope.toLowerCase(),
          question: QUESTION,
          options: OPTIONS,
          recommended,
          ...(components && { components }),
          ...(mockup && { mockup }),
        },
      },
      undefined,
      { timeout: 60000 },
    )
    .then((r) => {
      pending.settled = true
      const text = (r.content as { text: string }[])[0]?.text
      // A refused request (e.g. a Mock-up outside the convention) comes back as a tool error.
      if (r.isError) pending.error = text
      else pending.result = text
    })
    .catch((e) => {
      pending.error = String(e)
    })
}
