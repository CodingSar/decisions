import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../../../shared/testing/fixtures'

// Tests open folders by path; the native picker is only reachable through the real UI.
const open = (page: Page, path: string, setup = false) =>
  page.evaluate(([p, s]) => window.api.invoke('projects:open', p, s), [path, setup] as const)

Given('a folder {string} without git', async ({ folder }, name: string) => {
  folder(name)
})

Given('I pick a new empty folder {string}', async ({ folder }, name: string) => {
  folder(name)
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

When('I choose to set up a new project', async ({ page, folder }) => {
  await open(page, folder('shop'), true)
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

Then('the terminal runs the grill-with-docs interview', async ({ session }) => {
  await expect(session.page.getByRole('log', { name: 'Terminal' })).toContainText(
    '/grill-with-docs',
  )
})

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
