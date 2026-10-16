import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { asks, request } from '../../../shared/testing/fake-agent'
import { Given, Then, When } from '../../../shared/testing/fixtures'

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Project settings' })

async function openSettings(page: Page) {
  if (!(await dialog(page).isVisible()))
    await page.getByRole('button', { name: 'Project settings' }).click()
}

When('I open the project settings', async ({ page }) => {
  await openSettings(page)
})

When('I toggle off {string}', async ({ page }, scope: string) => {
  await openSettings(page)
  await dialog(page).getByRole('switch', { name: scope }).uncheck()
})

Given('I toggled off {string}', async ({ page }, scope: string) => {
  await openSettings(page)
  await dialog(page).getByRole('switch', { name: scope }).uncheck()
})

When('I set the timeout of {string} to {word}', async ({ page }, scope: string, t: string) => {
  await openSettings(page)
  const input = dialog(page).getByRole('textbox', { name: `Timeout ${scope}` })
  await input.fill(t)
  await input.blur()
})

When(
  'I set the timeout of {string} to {word} with Enter',
  async ({ page }, scope: string, t: string) => {
    await openSettings(page)
    const input = dialog(page).getByRole('textbox', { name: `Timeout ${scope}` })
    await input.fill(t)
    await input.press('Enter')
  },
)

Then('all {int} seeded Scopes are marked mine', async ({ page }, n: number) => {
  await expect(dialog(page).getByRole('switch', { checked: true })).toHaveCount(n)
})

Then('no timeout is set', async ({ page }) => {
  for (const box of await dialog(page)
    .getByRole('textbox', { name: /^Timeout / })
    .all())
    await expect(box).toHaveValue('')
})

Then(
  'the timeout of {string} still reads {string} and is flagged invalid',
  async ({ page }, scope: string, text: string) => {
    const input = dialog(page).getByRole('textbox', { name: `Timeout ${scope}` })
    await expect(input).toHaveValue(text)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  },
)

Then('a hint says {string}', async ({ page }, text: string) => {
  await expect(dialog(page).locator('.hint')).toContainText(text)
})

Then('the Add Scope field is titled {string}', async ({ page }, title: string) => {
  await expect(dialog(page).getByRole('textbox', { name: 'Add Scope' })).toHaveAttribute(
    'title',
    title,
  )
})

// After a relaunch the `page` fixture is stale; read the session's current page.
Then('{string} is still not mine', async ({ session }, scope: string) => {
  const page = session.page
  await openSettings(page)
  await expect(dialog(page).getByRole('switch', { name: scope })).not.toBeChecked()
})

Then(
  '{string} records {word} for {string}',
  async ({ folder }, file: string, t: string, scope: string) => {
    const config = JSON.parse(readFileSync(join(folder('api-service'), file), 'utf8'))
    expect(config.scopes.find((s: { name: string }) => s.name === scope)?.timeout).toBe(t)
  },
)

When('I add the Scope {string}', async ({ page }, scope: string) => {
  await openSettings(page)
  await dialog(page).getByRole('textbox', { name: 'Add Scope' }).fill(scope)
  await page.keyboard.press('Enter')
})

When('I delete the Scope {string}', async ({ page }, scope: string) => {
  await openSettings(page)
  await dialog(page)
    .getByRole('button', { name: `Delete ${scope}` })
    .click()
})

Given(
  'the Scope {string} has the answered Decision D4',
  async ({ page, folder }, scope: string) => {
    await openSettings(page)
    await dialog(page).getByRole('textbox', { name: 'Add Scope' }).fill(scope)
    await page.keyboard.press('Enter')
    const dir = join(folder('api-service'), '.decisions')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'D4.md'),
      `---\nscope: ${scope.toLowerCase()}\nstatus: answered\nby: human\n---\n# Q?\n\nAsked by: a\n\n- 1: x ★\n- 2: y\n\n## Verdict\n\nApproved: 1\n`,
    )
  },
)

Then('D4 is unchanged', async ({ folder }) => {
  expect(readFileSync(join(folder('api-service'), '.decisions', 'D4.md'), 'utf8')).toContain(
    'status: answered',
  )
})

Then('seeded Scopes offer no delete', async ({ page }) => {
  await expect(dialog(page).getByRole('button', { name: 'Delete Architecture' })).toHaveCount(0)
  await expect(dialog(page).getByRole('button', { name: /^Delete / })).toHaveCount(0)
})

// The feature has no Run step: start one on first use.
const started = new WeakSet<Page>()
async function agentRequests(page: Page, scope: string) {
  if (!started.has(page)) {
    started.add(page)
    await page.evaluate(() => window.api.invoke('runs:create'))
    await page.evaluate(() => window.api.invoke('runs:start', 'R1'))
  }
  await request(page, 'R1', 'orchestrator', scope)
}

When('an agent requests a {string} Decision', async ({ page }, scope: string) => {
  await agentRequests(page, scope)
})

Then("it is Auto-resolved on the agent's recommendation", async ({ page }) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe('Approved: 1')
})

Then('it is listed in Review', async ({ page }) => {
  await page.getByRole('button', { name: 'Review' }).click()
  await expect(page.getByRole('region', { name: 'Review' })).toContainText('D1')
})

Then('an agent can request an {string} Decision', async ({ page }, scope: string) => {
  await agentRequests(page, scope)
})

When('an agent requests a Decision with the Scope {string}', async ({ page }, scope: string) => {
  await agentRequests(page, scope)
})

Then('it appears in the Feed', async ({ page }) => {
  await expect(page.getByRole('article')).toBeVisible()
})

// Blocked keys leave no trace; wait long enough for a Verdict or a Run to have shown up.
Then('no Verdict was sent and no Run was created', async ({ page }) => {
  await page.waitForTimeout(300)
  expect(asks.get(page)?.every((a) => !a.settled)).toBe(true)
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^R2 · / })).toHaveCount(0)
})
