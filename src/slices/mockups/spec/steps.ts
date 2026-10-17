import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import type { DataTable } from 'playwright-bdd'
import { asks, request } from '../../../shared/testing/fake-agent'
import { Given, Then, When } from '../../../shared/testing/fixtures'
import { BOARD } from '../model'

// A board with the elements the scenarios mark; `note` tells the proposal and the approved one apart.
const board = (note: string) => `<!doctype html><html><body style="margin:0;font:16px sans-serif">
<header style="height:60px;padding:0 24px;display:flex;align-items:center;gap:16px;background:#eee">api-service</header>
<main style="padding:24px;display:flex;gap:24px">
<input placeholder="Search" style="height:40px;width:320px">
<button style="height:40px;padding:0 16px">Sort</button>
<button style="height:40px;padding:0 16px">Save</button>
<p>${note}</p>
</main></body></html>`

const PROPOSAL = 'docs/mock/feed-sort-for-approval.html'
const proposed = new WeakMap<Page, string>()

const write = (folder: (n: string) => string, rel: string, note: string) => {
  const file = join(folder('api-service'), rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, board(note))
}

Given('the Project has a Mock-up {string}', async ({ page, folder }, rel: string) => {
  write(folder, rel, 'proposed board')
  proposed.set(page, rel)
})

Given('the Project has an approved Mock-up {string}', async ({ folder }, rel: string) => {
  write(folder, rel, 'approved board')
})

When(
  'the agent requests a {string} Decision with that Mock-up',
  async ({ page }, scope: string) => {
    await request(page, 'R1', 'orchestrator > ui-agent', scope, 0, undefined, proposed.get(page))
  },
)

Given('a pending Mock-up Decision', async ({ page, folder }) => {
  write(folder, PROPOSAL, 'proposed board')
  await request(page, 'R1', 'orchestrator > ui-agent', 'Ui', 0, undefined, PROPOSAL)
  await expect(page.getByRole('article')).toHaveCount(1)
})

Then('the card shows the Mock-up thumbnail', async ({ page }) => {
  const thumb = page.getByRole('article').getByRole('button', { name: 'Mock-up' })
  await expect(thumb).toBeVisible()
  await expect(thumb.frameLocator('iframe').getByRole('button', { name: 'Sort' })).toBeVisible()
})

Then('{string} records {string}', async ({ folder }, file: string, line: string) => {
  expect(readFileSync(join(folder('api-service'), file), 'utf8')).toContain(line)
})

Then('the agent gets the error {string}', async ({ page }, text: string) => {
  await expect.poll(() => asks.get(page)?.[0]?.error).toBe(text)
})

const inspector = (page: Page) => page.getByRole('dialog', { name: 'Mock-up' })

Then('the Inspector shows the Mock-up', async ({ page }) => {
  await expect(
    inspector(page).frameLocator('iframe[title="Mock-up"]').getByText('proposed board'),
  ).toBeVisible()
})

Then('the Inspector shows the approved Mock-up', async ({ page }) => {
  await expect(
    inspector(page).frameLocator('iframe[title="Approved Mock-up"]').getByText('approved board'),
  ).toBeVisible()
})

// Screen position of the centre of the element labelled `text` (its text or placeholder) in the
// scaled board; Playwright's boundingBox does not follow the CSS scale into the frame.
const centre = (page: Page, text: string) =>
  page.evaluate(
    ({ text, width }) => {
      const frame = document.querySelector<HTMLIFrameElement>(
        '[role="dialog"] iframe[title="Mock-up"]',
      )
      const doc = frame?.contentDocument
      if (!frame || !doc) throw new Error('the Mock-up is not open')
      const el = [...doc.querySelectorAll('body *')].find(
        (e) =>
          e.getAttribute('placeholder') === text ||
          (e.children.length === 0 && e.textContent?.trim() === text),
      )
      if (!el) throw new Error(`"${text}" is not in the Mock-up`)
      const outer = frame.getBoundingClientRect()
      const inner = el.getBoundingClientRect()
      const s = outer.width / width
      return {
        x: outer.left + (inner.left + inner.width / 2) * s,
        y: outer.top + (inner.top + inner.height / 2) * s,
      }
    },
    { text, width: BOARD.width },
  )

When('I press X and click {string} in the Mock-up', async ({ page }, text: string) => {
  await page.keyboard.press('x')
  await expect(inspector(page).getByRole('button', { name: 'Remove' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const p = await centre(page, text)
  await page.mouse.click(p.x, p.y)
})

When(
  'I press N, click {string} in the Mock-up and type {string}',
  async ({ page }, text: string, note: string) => {
    await page.keyboard.press('n')
    const p = await centre(page, text)
    await page.mouse.click(p.x, p.y)
    await expect(inspector(page).getByRole('textbox', { name: 'Note' })).toBeFocused()
    await page.keyboard.type(note)
    await page.keyboard.press('Enter')
  },
)

When('I drag {string} onto {string} in the Mock-up', async ({ page }, from: string, to: string) => {
  const a = await centre(page, from)
  const b = await centre(page, to)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(b.x, b.y, { steps: 5 })
  await page.mouse.up()
})

Then('the Inspector lists {int} Marks', async ({ page }, n: number) => {
  await expect(
    inspector(page).getByRole('list', { name: 'Marks' }).getByRole('listitem'),
  ).toHaveCount(n)
})

Then(
  'the agent receives {string} with the Marks',
  async ({ page }, text: string, marks: DataTable) => {
    const lines = marks.raw().map(([m]) => `- ${m}`)
    await expect
      .poll(() => asks.get(page)?.[0]?.result)
      .toBe([`Rejected: ${text}`, ...lines].join('\n'))
  },
)

Then('{string} exists in the Project', async ({ folder }, rel: string) => {
  await expect.poll(() => existsSync(join(folder('api-service'), rel))).toBe(true)
})

Then('{string} is gone from the Project', async ({ folder }, rel: string) => {
  expect(existsSync(join(folder('api-service'), rel))).toBe(false)
})
