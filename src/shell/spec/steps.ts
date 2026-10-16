import { expect, type Locator, type Page } from '@playwright/test'
import { request } from '../../shared/testing/fake-agent'
import { Given, Then, When } from '../../shared/testing/fixtures'

// The page fixture launches the app, so launching is implicit.
When('I launch the app', async ({ page }) => {
  await page.waitForLoadState()
})

Then('I see the {string} window', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(title)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

// Work across Projects and Runs
const invoke = (page: Page, channel: string, ...args: unknown[]) =>
  page.evaluate(([c, a]) => window.api.invoke(c as string, ...(a as unknown[])), [
    channel,
    args,
  ] as const)

Given('Projects {string} and {string} are open', async ({ page, folder }, a: string, b: string) => {
  for (const name of [a, b]) await invoke(page, 'projects:open', folder(name))
})

Given('{string} is active', async ({ page, folder }, name: string) => {
  await invoke(page, 'projects:focus', folder(name))
})

When('I switch to {string}', async ({ page }, name: string) => {
  await page.getByRole('tab', { name }).click()
})

Then('I see the {string} Feed, Runs and terminal', async ({ page }, name: string) => {
  await expect(page.getByRole('tab', { name, selected: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Feed' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Terminal pane' })).toBeVisible()
})

// Runs a fake agent in `name`'s Project that asks one Decision, then returns to the active tab.
When('{string} receives a pending Decision', async ({ page, folder }, name: string) => {
  const active = await page.getByRole('tab', { selected: true }).innerText()
  await invoke(page, 'projects:focus', folder(name))
  const id = (await invoke(page, 'runs:create')) as string
  await invoke(page, 'runs:start', id)
  await invoke(page, 'projects:focus', folder(active))
  await request(page, id, 'orchestrator > api-agent', 'Architecture')
})

Then('the {string} tab badge increases', async ({ page }, name: string) => {
  await expect(page.getByRole('tab', { name }).getByRole('status')).toHaveText('1')
})

// Focus: a unit shows the ring when it holds the DOM focus.
const hasFocus = (unit: Locator) => unit.evaluate((el) => el.contains(document.activeElement))
const expectFocus = (unit: Locator, focused = true) =>
  expect.poll(() => hasFocus(unit)).toBe(focused)

const card = (page: Page) => page.getByRole('article').first()
const terminal = (page: Page) => page.getByRole('region', { name: 'Terminal pane' })
const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Sidebar' })

// Hovering waits past the 150 ms dwell. Parallel workers share one X display, so another
// worker's window appearing or closing sends the real pointer (parked at the window centre)
// into this window and restarts the dwell elsewhere; hover again until the unit holds focus.
const rest = async (page: Page, unit: Locator) => {
  await expect
    .poll(async () => {
      await unit.hover()
      await page.waitForTimeout(250)
      return hasFocus(unit)
    })
    .toBe(true)
}

When('the mouse rests on a Feed card for 150 ms', async ({ page }) => {
  const id = (await invoke(page, 'runs:create')) as string
  await invoke(page, 'runs:start', id)
  await request(page, id, 'orchestrator > api-agent', 'Architecture')
  await expect(card(page)).toBeVisible()
  await rest(page, sidebar(page)) // leave the card's default focus first
  await rest(page, card(page))
})

Then('the card shows the focus ring', async ({ page }) => {
  await expectFocus(card(page))
})

When('the mouse moves onto the terminal for 150 ms', async ({ page }) => {
  await rest(page, terminal(page))
})

Then('the terminal has the focus ring and the card does not', async ({ page }) => {
  await expectFocus(terminal(page))
  await expectFocus(card(page), false)
})

When('I press Cmd+Shift+]', async ({ page }) => {
  await expect(sidebar(page)).toBeVisible()
  await page.keyboard.press('Meta+Shift+BracketRight')
})

// The Workspace listens only once its layout has loaded: wait for the sidebar toggle.
When('I press Cmd+B', async ({ page }) => {
  await expect(page.getByRole('button', { name: /^(Hide|Show) sidebar/ })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+b')
})

When('I press Cmd+Shift+E', async ({ page }) => {
  await expect(page.getByRole('button', { name: /^(Hide|Show) sidebar/ })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+Shift+e')
})

Then('the next Project tab is focused', async ({ page }) => {
  await expect(page.getByRole('tab', { selected: true })).toHaveText('api-service') // wraps from "shop"
})

const width = async (el: Locator) => (await el.boundingBox())?.width as number
let before = 0

When('I drag the terminal edge {int}px wider', async ({ page }, px: number) => {
  before = await width(terminal(page))
  const box = (await page.getByRole('separator', { name: 'Resize terminal' }).boundingBox()) as {
    x: number
    y: number
    width: number
    height: number
  }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - px, y, { steps: 5 })
  await page.mouse.up()
})

Then('the terminal is {int}px wider', async ({ session }, px: number) => {
  await expect.poll(() => width(terminal(session.page))).toBeCloseTo(before + px, 0)
})

When('I hide the sidebar with the minus icon', async ({ page }) => {
  await page.getByRole('button', { name: 'Hide sidebar' }).click()
})

Then('an edge strip with an arrow remains', async ({ page }) => {
  await expect(sidebar(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Show sidebar' })).toBeVisible()
})

When('I click the arrow', async ({ page }) => {
  await page.getByRole('button', { name: 'Show sidebar' }).click()
})

Then('the sidebar returns', async ({ page }) => {
  await expect(sidebar(page)).toBeVisible()
})

Given('{string} has a running Run', async ({ page, folder }, name: string) => {
  await invoke(page, 'projects:focus', folder(name))
  const id = (await invoke(page, 'runs:create')) as string
  await invoke(page, 'runs:start', id)
  await request(page, id, 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
})

// biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
Given('{string} has no running Run', async ({}, _name: string) => {})

When('I close the {string} tab', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Close ${name}` }).click()
})

Then('a confirmation appears', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: 'Close project' })).toBeVisible()
})

Then('confirming stops the Run and closes the tab', async ({ page }) => {
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByRole('tab', { name: 'shop' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

Then('{string} Decisions reappear when reopened', async ({ page, folder }, name: string) => {
  await invoke(page, 'projects:open', folder(name))
  await expect(page.getByRole('article', { name: 'D1' })).toBeVisible()
  const id = 'R1'
  await expect(page.getByRole('button', { name: `${id} · stopped` })).toBeVisible()
})

Then('it closes without confirmation', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'api-service' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
