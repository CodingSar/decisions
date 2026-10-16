import { accessSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { expect } from '@playwright/test'
import { Given, Then, test } from '../../../shared/testing/fixtures'

const hasClaude = (process.env.PATH ?? '').split(delimiter).some((d) => {
  try {
    accessSync(join(d, 'claude'))
    return true
  } catch {
    return false
  }
})

Given('the Agent Runtime is Claude Code', async ({ page }) => {
  test.skip(!hasClaude, '"claude" CLI not on PATH')
  await page.evaluate(() => window.api.invoke('agent:use-runtime', 'claude-code'))
})

Then('the terminal shows output', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(/\S/, { timeout: 15000 })
})
