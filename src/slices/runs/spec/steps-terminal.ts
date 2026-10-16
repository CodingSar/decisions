import { expect } from '@playwright/test'
import { Then } from '../../../shared/testing/fixtures'

const host = (page: import('@playwright/test').Page) => page.getByRole('log', { name: 'Terminal' })

Then("the terminal background is the app's deep tone", async ({ page }) => {
  const [bg, deep] = await host(page).evaluate((el) => {
    const toRgb = (c: string) => {
      const s = document.createElement('span')
      s.style.color = c
      document.body.append(s)
      const rgb = getComputedStyle(s).color
      s.remove()
      return rgb
    }
    const screen = el.querySelector('.xterm-screen') as HTMLElement
    return [
      getComputedStyle(screen.parentElement as HTMLElement).backgroundColor,
      toRgb(getComputedStyle(document.documentElement).getPropertyValue('--deep').trim()),
    ]
  })
  expect(bg).toBe(deep)
})

// The host carries the stack the terminal was opened with; the face itself must have loaded.
Then('the terminal font is {string}', async ({ page }, font: string) => {
  const [family, loaded] = await host(page).evaluate(async (el) => {
    await document.fonts.ready
    const family = getComputedStyle(el).fontFamily
    return [family, document.fonts.check(`12px ${family.split(',')[0]}`)]
  })
  expect(family.replace(/^"/, '')).toMatch(new RegExp(`^${font}`))
  expect(loaded).toBe(true)
})

Then('the terminal renderer is webgl or dom', async ({ page }) => {
  await expect(host(page)).toHaveAttribute('data-renderer', /^(webgl|dom)$/)
})

Then('the terminal shows {string} with {string}', async ({ page }, id: string, text: string) => {
  await expect(host(page)).toContainText(`session ${id}`)
  await expect(host(page)).toContainText(text)
})

Then('only {int} terminals were created', async ({ page }, n: number) => {
  expect(await page.evaluate(() => window.terminals.created())).toBe(n)
})

Then('the terminal ends with {string}', async ({ page }, text: string) => {
  await expect(host(page)).toContainText(text, { timeout: 15000 })
})

Then('the Run was paused at least once', async ({ page }) => {
  expect(await page.evaluate(() => window.api.invoke('runs:pauses', 'R1'))).toBeGreaterThan(0)
})

Then('the sidebar lists Run {string} as waiting', async ({ page }, id: string) => {
  await expect(page.getByRole('button', { name: `${id} · waiting` })).toBeVisible()
})

Then('the terminal header shows the waiting chip', async ({ page }) => {
  await expect(page.locator('.term-head .chip')).toHaveText('waiting')
})

Then('the sidebar and terminal header show {string} running', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name: `${name} · running` })).toBeVisible()
  await expect(page.getByRole('heading').getByText(name)).toBeVisible()
})

Then('the terminal header shows {int}% progress', async ({ page }, pct: number) => {
  await expect(page.getByRole('progressbar', { name: 'Progress' })).toHaveAttribute(
    'aria-valuenow',
    String(pct),
  )
})
