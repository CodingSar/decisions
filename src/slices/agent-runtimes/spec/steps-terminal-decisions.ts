import { join } from 'node:path'
import { expect } from '@playwright/test'
import { asks, requestFromTerminal } from '../../../shared/testing/fake-agent'
import { Then, When } from '../../../shared/testing/fixtures'

When(
  'a coding agent in the folder {string} requests a Decision',
  async ({ page, folder }, name: string) => {
    await requestFromTerminal(page, folder(name), 'terminal agent', 'Architecture')
  },
)

When(
  'a coding agent in the subfolder {string} of {string} requests a Decision',
  async ({ page, folder }, sub: string, name: string) => {
    await requestFromTerminal(page, join(folder(name), sub), 'terminal agent', 'Architecture')
  },
)

Then('the Feed shows the Decision', async ({ page }) => {
  await expect(page.getByRole('article')).toHaveCount(1)
})

Then('the agent is told to open the folder in the app', async ({ page }) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toContain('Open the folder as a Project')
})
