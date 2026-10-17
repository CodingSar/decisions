import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../../../shared/testing/fixtures'

// Tests open folders by path; the native picker is only reachable through the real UI.
const open = (page: Page, path: string, setup = false) =>
  page.evaluate(([p, s]) => window.api.invoke('projects:open', p, s), [path, setup] as const)

Given('a folder {string} without git', async ({ folder }, name: string) => {
  folder(name)
})

// The native folder dialog is replaced by a test hook that answers with this folder.
Given('I pick a new empty folder {string}', async ({ page, folder }, name: string) => {
  await page.evaluate((e) => window.api.invoke('agent:env', e), { DECISIONS_PICK: folder(name) })
})

Given('the Project {string} is open( in a tab)', async ({ page, folder }, name: string) => {
  await open(page, folder(name))
})

// Decisions left on disk by an earlier session; D2 is Auto-resolved when `auto` is set.
const seed = (dir: string, id: number, status: 'pending' | 'answered') => {
  mkdirSync(join(dir, '.decisions'), { recursive: true })
  const auto = status === 'answered' ? 'by: auto\nreason: out-of-scope\n' : ''
  writeFileSync(
    join(dir, '.decisions', `D${id}.md`),
    `---\nscope: architecture\nstatus: ${status}\n${auto}---\n# Which storage?\n\nAsked by: orchestrator > api-agent\n\n- 1: Plain files ★\n- 2: SQLite\n`,
  )
}

Given(
  'a folder {string} with Decisions D1 pending and D2 Auto-resolved',
  async ({ folder }, name: string) => {
    seed(folder(name), 1, 'pending')
    seed(folder(name), 2, 'answered')
  },
)

Given('{string} has a pending Decision from a stopped Run', async ({ folder }, name: string) =>
  seed(folder(name), 1, 'pending'),
)

Given(
  'Projects {string} and {string} are open and {string} is active',
  async ({ page, folder }, a: string, b: string, active: string) => {
    for (const name of [a, b].sort((x) => (x === active ? 1 : -1))) await open(page, folder(name))
  },
)

Given(
  'the Project {string} was open and its folder is deleted',
  async ({ page, folder }, name: string) => {
    await open(page, folder(name))
    rmSync(folder(name), { recursive: true })
  },
)

When('I open the folder as a Project', async ({ page, folder }) => {
  await open(page, folder('api-service'))
})

When('I open the folder {string} again', async ({ page, folder }, name: string) => {
  await open(page, folder(name))
})

When('I choose to set up a new project', async ({ page }) => {
  // A finished setup closes the picker; reopen it with the New tab button for a second one.
  const card = page.getByRole('button', { name: 'Set up a new project' })
  if (!(await card.isVisible())) await page.getByRole('button', { name: 'New tab' }).click()
  await card.click()
  await expect(card).toBeHidden()
})

When('I relaunch the app', async ({ session }) => {
  await session.relaunch()
})

Then('the Feed shows D1', async ({ session }) => {
  await expect(session.page.getByRole('article', { name: 'D1' })).toBeVisible()
})

Then('the Review tab shows D2', async ({ session }) => {
  await session.page.getByRole('button', { name: 'Review' }).click()
  await expect(session.page.getByRole('region', { name: 'Review' })).toContainText('D2')
})

Then('the {string} Feed shows the pending Decision', async ({ session }, name: string) => {
  await session.page.getByRole('tab', { name }).click()
  await expect(session.page.getByRole('article', { name: 'D1' })).toBeVisible()
})

Then('a Project tab {string} is focused', async ({ session }, name: string) => {
  await expect(session.page.getByRole('tab', { name, selected: true })).toBeVisible()
})

Then('the folder contains {string}', async ({ folder }, entry: string) => {
  expect(existsSync(join(folder('api-service'), entry))).toBe(true)
})

Then('the terminal starts the setup interview', async ({ session }) => {
  await expect(session.page.getByRole('log', { name: 'Terminal' })).toContainText('grilling')
})

Then(
  '{string} is the highlighted card, {string} is not',
  async ({ page }, primary: string, other: string) => {
    const card = (name: string) => page.getByRole('button', { name })
    const border = (name: string) => card(name).evaluate((el) => getComputedStyle(el).borderColor)
    await expect(card(primary)).toHaveAttribute('data-primary', 'true')
    await expect(card(other)).not.toHaveAttribute('data-primary', 'true')
    expect(await border(primary)).not.toBe(await border(other))
  },
)

Then('the existing tab is focused', async ({ session }) => {
  await expect(session.page.getByRole('tab', { selected: true })).toHaveText('api-service')
})

Then('only one tab {string} exists', async ({ session }, name: string) => {
  await expect(session.page.getByRole('tab', { name })).toHaveCount(1)
})

Then(
  'tabs {string} and {string} are open and {string} is focused',
  async ({ session }, a: string, b: string, active: string) => {
    await expect(session.page.getByRole('tab')).toHaveText([a, b])
    await expect(session.page.getByRole('tab', { selected: true })).toHaveText(active)
  },
)

Then('no Run is running', async ({ session }) => {
  await expect(session.page.getByRole('button', { name: /· running/ })).toHaveCount(0)
})

Then(
  'the tab {string} is shown as unavailable with a close icon',
  async ({ session }, name: string) => {
    await expect(session.page.getByRole('tab', { name })).toHaveAttribute('aria-disabled', 'true')
    await expect(session.page.getByRole('button', { name: `Close ${name}` })).toBeVisible()
  },
)

Then('its tooltip says the folder was not found', async ({ session }) => {
  await expect(session.page.getByRole('tab', { name: 'old' })).toHaveAttribute(
    'title',
    /^Folder not found: .*old$/,
  )
})

When('I close the Project {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Close ${name}` }).click()
})

Then('Recent lists {string} with {int} pending', async ({ page }, name: string, count: number) => {
  const item = page.getByRole('list', { name: 'Recent' }).getByRole('button', { name })
  await expect(item.getByRole('status')).toHaveText(String(count))
})

When('I click {string} under Recent', async ({ page }, name: string) => {
  await page.getByRole('list', { name: 'Recent' }).getByRole('button', { name }).click()
})

// "shop/.mcp.json" -> the file in that scenario folder
const at = (folder: (n: string) => string, path: string) => {
  const [name, ...rest] = path.split('/')
  return join(folder(name), ...rest)
}

Given(
  'I pick a folder {string} with its own CLAUDE.md and an MCP server {string}',
  async ({ page, folder }, name: string, server: string) => {
    const dir = folder(name)
    writeFileSync(join(dir, 'CLAUDE.md'), '# shop rules\n')
    writeFileSync(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { [server]: { command: 'x' } } }),
    )
    await page.evaluate((e) => window.api.invoke('agent:env', e), { DECISIONS_PICK: dir })
  },
)

Then(
  '{string} configures the {string}, {string} and {string} servers',
  async ({ folder }, file: string, a: string, b: string, c: string) => {
    const servers = JSON.parse(readFileSync(at(folder, file), 'utf8')).mcpServers
    for (const s of [a, b, c]) expect(servers[s]).toBeDefined()
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the literal Claude Code expands
    expect(servers.decisions.headers['X-Project-Dir']).toBe('${PWD}')
  },
)

Then('{string} enables the {string} plugin', async ({ folder }, file: string, plugin: string) => {
  const enabled = JSON.parse(readFileSync(at(folder, file), 'utf8')).enabledPlugins
  expect(Object.keys(enabled).some((k) => k.startsWith(`${plugin}@`))).toBe(true)
})

Then('{string} tells agents to ask through {string}', async ({ folder }, file: string, tool) => {
  expect(readFileSync(at(folder, file), 'utf8')).toContain(tool)
})

Then('{string} still configures the server {string}', async ({ folder }, file, server: string) => {
  expect(JSON.parse(readFileSync(at(folder, file), 'utf8')).mcpServers[server]).toBeDefined()
})

Then(
  '{string} starts with the original text and has one Decisions section',
  async ({ folder }, file: string) => {
    const text = readFileSync(at(folder, file), 'utf8')
    expect(text.startsWith('# shop rules\n')).toBe(true)
    expect(text.match(/^## Decisions$/gm)).toHaveLength(1)
  },
)

Then('the terminal explains that {string} could not be installed', async ({ page }, p: string) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(
    `${p} could not be installed`,
  )
})
