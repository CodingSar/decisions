import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { expect, type Page } from '@playwright/test'
import { request } from '../../../shared/testing/fake-agent'
import { Given, Then, When } from '../../../shared/testing/fixtures'

// The fixture always launches with the fake adapter.
Given('the Agent Runtime is the fake adapter', async () => {})

When('I create a new Run and press start', async ({ page }) => {
  await page.getByRole('button', { name: 'New Run' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
})

Then('the terminal shows the placeholder {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('region', { name: 'Terminal pane' })).toContainText(text)
})

When('I press the Run button in the terminal', async ({ page }) => {
  await page.getByRole('button', { name: 'Run', exact: true }).click()
})

Then('the terminal shows an orchestrator session', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('orchestrator session')
})

Then('the sidebar lists Run {string} as running', async ({ page }, id: string) => {
  await expect(page.getByRole('button', { name: `${id} · running` })).toBeVisible()
})

Then('the agent can call {string}', async ({ page }, tool: string) => {
  const url = (await page.evaluate(() => window.api.invoke('agent:mcp-url'))) as string
  const client = new Client({ name: 'test-agent', version: '0.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(url)))
  const { tools } = await client.listTools()
  const found = tools.find((t) => t.name === tool)
  expect(found).toBeDefined()
  const props = found?.inputSchema.properties as Record<string, { maxItems?: number }>
  expect(props.options.maxItems).toBe(4)

  // Out-of-cap input is rejected without blocking.
  const bad = await client.callTool({
    name: tool,
    arguments: { scope: 'ui', question: 'q', options: ['only one'], recommended: 0 },
  })
  expect(bad.isError).toBe(true)
  await client.close()
})

const create = (page: Page) => page.evaluate(() => window.api.invoke('runs:create'))
const start = (page: Page, id: string) =>
  page.evaluate((i) => window.api.invoke('runs:start', i), id)
const stop = (page: Page, id: string) => page.evaluate((i) => window.api.invoke('runs:stop', i), id)
const runButton = (page: Page, name: string, status: string) =>
  page.getByRole('button', { name: `${name} · ${status}` })

Given('Run {string} exists', async ({ page }, _id: string) => {
  await create(page)
})

Given('Run {string} is running', async ({ page }, id: string) => {
  await create(page)
  await start(page, id)
  await expect(runButton(page, id, 'running')).toBeVisible()
})

Given(
  'Runs {string} and {string} are running and {string} is selected',
  async ({ page }, _a: string, _b: string, _c: string) => {
    for (const id of ['R1', 'R2']) {
      await create(page)
      await start(page, id)
    }
    await expect(runButton(page, 'R2', 'running')).toBeVisible()
  },
)

Given('Run {string} is running with a pending Decision', async ({ page }, id: string) => {
  await create(page)
  await start(page, id)
  await request(page, id, 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
})

Given('Run {string} is stopped', async ({ page }, id: string) => {
  await create(page)
  await start(page, id)
  await stop(page, id)
  await expect(runButton(page, id, 'stopped')).toBeVisible()
})

Given('the {string} CLI is not found', async ({ page }, _cli: string) => {
  await page.evaluate(() => window.api.invoke('agent:use-runtime', 'claude-code'))
  await page.evaluate(() => window.api.invoke('agent:hide-claude'))
})

When('I select {string} in the sidebar', async ({ page }, id: string) => {
  await page.getByRole('button', { name: new RegExp(`^${id} · `) }).click()
})

When('I select it', async ({ page }) => {
  await page.getByRole('button', { name: /^R1 · / }).click()
})

When('I rename it to {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: 'Rename Run' }).click()
  await page.getByRole('textbox', { name: 'Run name' }).fill(name)
  await page.keyboard.press('Enter')
})

When('I press stop', async ({ page }) => {
  await page.getByRole('button', { name: 'Stop' }).click()
})

When('I press Close', async ({ page }) => {
  await page.getByRole('button', { name: 'Close', exact: true }).click()
})

Then('the start icon is disabled', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled()
})

Then('the stop icon is enabled', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Stop' })).toBeEnabled()
})

Then(
  'the sidebar lists {string} and {string} as running',
  async ({ page }, a: string, b: string) => {
    await expect(runButton(page, a, 'running')).toBeVisible()
    await expect(runButton(page, b, 'running')).toBeVisible()
  },
)

Then('the terminal shows {string}', async ({ page }, id: string) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(`session ${id}`)
})

Then('the sidebar and terminal header show {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name: `${name} · idle` })).toBeVisible()
  await expect(page.getByRole('heading').getByText(name)).toBeVisible()
})

Then('{string} is marked stopped', async ({ page }, id: string) => {
  await expect(runButton(page, id, 'stopped')).toBeVisible()
})

Then('the pending Decision stays in the Feed', async ({ page }) => {
  await expect(page.getByRole('article')).toHaveCount(1)
})

Then('the terminal shows its scrollback read-only', async ({ page }) => {
  const log = page.getByRole('log', { name: 'Terminal' })
  await expect(log).toContainText('orchestrator session R1')
  await expect(log).toHaveAttribute('data-readonly', 'true')
})

Then('the terminal shows the error', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('not found')
})

Then('the error says {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(text)
})

Then('no terminal is shown', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toHaveCount(0)
})

Then(
  'its row reads {string} with the tooltip {string}',
  async ({ page }, text: string, tip: string) => {
    const row = page.getByRole('button', { name: tip })
    await expect(row).toHaveText(text)
    await expect(row).toHaveAttribute('title', tip)
  },
)

Then('the Run is marked failed', async ({ page }) => {
  await expect(runButton(page, 'R1', 'failed')).toBeVisible()
})

When('I type {string} in the terminal', async ({ page }, text: string) => {
  await page.getByRole('log', { name: 'Terminal' }).click()
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
})

Then('the sidebar does not list {string}', async ({ page }, id: string) => {
  await expect(page.getByRole('button', { name: new RegExp(`^${id} · `) })).toHaveCount(0)
})

Then('{string} never shows as failed', async ({ page }, id: string) => {
  const failed = runButton(page, id, 'failed')
  for (const end = Date.now() + 500; Date.now() < end; ) {
    expect(await failed.count()).toBe(0)
    await page.waitForTimeout(25)
  }
  await expect(runButton(page, id, 'stopped')).toBeVisible()
})
