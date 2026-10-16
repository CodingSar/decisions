import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Page } from '@playwright/test'

export interface Ask {
  settled: boolean
  result?: string
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
) {
  const base = (await page.evaluate(() => window.api.invoke('agent:mcp-url'))) as string
  const client = new Client({ name: 'fake-agent', version: '0.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/${runId}`)))
  const ask: Ask = { settled: false }
  asks.set(page, [...(asks.get(page) ?? []), ask])
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
        },
      },
      undefined,
      { timeout: 60000 },
    )
    .then((r) => {
      ask.settled = true
      ask.result = (r.content as { text: string }[])[0]?.text
    })
}
