import { accessSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { expect } from '@playwright/test'
import { Given, Then, test } from '../../../shared/testing/fixtures'

const hasClaude = (dir: string) => {
  try {
    accessSync(join(dir, 'claude'))
    return true
  } catch {
    return false
  }
}
const pathDirs = (process.env.PATH ?? '').split(delimiter)

Given('the Agent Runtime is Claude Code', async ({ page }) => {
  test.skip(!pathDirs.some(hasClaude), '"claude" CLI not on PATH')
  await page.evaluate(() => window.api.invoke('agent:use-runtime', 'claude-code'))
})

// Like a Dock launch: the app's PATH lacks `claude`; only the login shell knows where it is.
Given('"claude" is installed only on the login shell\'s PATH', async ({ page, folder }) => {
  const bin = folder('login-bin')
  writeFileSync(join(bin, 'claude'), '#!/bin/sh\necho "fake claude"\nexec cat >/dev/null\n', {
    mode: 0o755,
  })
  const shell = join(folder('login-shell'), 'sh')
  writeFileSync(shell, `#!/bin/sh\nprintf %s '${bin}'\n`, { mode: 0o755 })
  const env = { PATH: pathDirs.filter((d) => !hasClaude(d)).join(delimiter), SHELL: shell }
  await page.evaluate(() => window.api.invoke('agent:use-runtime', 'claude-code'))
  await page.evaluate((e) => window.api.invoke('agent:env', e), env)
})

Then('the terminal shows output', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(/\S/, { timeout: 15000 })
})

Then('the terminal prints {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(text)
})
