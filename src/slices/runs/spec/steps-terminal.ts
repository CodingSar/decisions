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
