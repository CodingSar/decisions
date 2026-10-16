import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../../../shared/testing/fixtures'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe' })

const write = (root: string, rel: string, text: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}

const section = (page: Page) => page.getByRole('region', { name: 'Git' })

// A repo with one commit holding src/app.ts, opened as a Project.
Given(
  'the Project {string} is a git repository on branch {string}',
  async ({ page, folder }, name: string, branch: string) => {
    const dir = folder(name)
    git(dir, 'init', '-b', branch)
    git(dir, 'config', 'user.name', 'Tester')
    git(dir, 'config', 'user.email', 'tester@example.com')
    write(dir, 'src/app.ts', 'export const a = 1\n')
    git(dir, 'add', '.')
    git(dir, 'commit', '-m', 'Initial')
    await page.evaluate((p) => window.api.invoke('projects:open', p, false), dir)
  },
)

Given('{string} has uncommitted changes', async ({ folder }, path: string) => {
  write(folder('api-service'), path, 'export const a = 2\n')
})

Then('the Git section lists {string}( under Changes)', async ({ page }, path: string) => {
  await expect(section(page).getByRole('button', { name: path, exact: true })).toBeVisible()
})

When('I click {string} in the Git section', async ({ page }, path: string) => {
  await section(page).getByRole('button', { name: path, exact: true }).click()
})

Then('the Git view shows its diff', async ({ page }) => {
  const view = page.getByRole('region', { name: 'Git view' })
  await expect(view.locator('.monaco-diff-editor')).toBeVisible()
  await expect(view.locator('.line-insert').first()).toBeVisible()
})

When('I stage {string}', async ({ page }, path: string) => {
  await section(page)
    .getByRole('button', { name: `Stage ${path}` })
    .click()
})

When('I commit with the message {string}', async ({ page }, message: string) => {
  await section(page).getByRole('textbox', { name: 'Commit message' }).fill(message)
  await section(page).getByRole('button', { name: 'Commit', exact: true }).click()
})

Then('{string} is no longer listed', async ({ page }, path: string) => {
  await expect(section(page).getByRole('button', { name: path, exact: true })).toHaveCount(0)
})

Then('the commit message is empty', async ({ page }) => {
  await expect(section(page).getByRole('textbox', { name: 'Commit message' })).toHaveValue('')
})

Then('the latest commit message is {string}', async ({ folder }, message: string) => {
  expect(git(folder('api-service'), 'log', '-1', '--format=%s').toString().trim()).toBe(message)
})

Then('the commit icon is disabled', async ({ page }) => {
  await expect(section(page).getByRole('button', { name: 'Commit', exact: true })).toBeDisabled()
})

Then('the commit icon is still disabled until I type a message', async ({ page }) => {
  const commit = section(page).getByRole('button', { name: 'Commit', exact: true })
  await expect(commit).toBeDisabled()
  await section(page).getByRole('textbox', { name: 'Commit message' }).fill('x')
  await expect(commit).toBeEnabled()
})

const remoteOf = (folder: (n: string) => string) => folder('remote.git')

Given('a remote exists', async ({ folder }) => {
  const dir = folder('api-service')
  git(folder('remote.git'), 'init', '--bare', '-b', 'main')
  git(dir, 'remote', 'add', 'origin', remoteOf(folder))
  git(dir, 'push', '-u', 'origin', 'main')
})

When('I commit and push', async ({ page }) => {
  await section(page).getByRole('button', { name: 'Stage src/app.ts' }).click()
  await section(page).getByRole('textbox', { name: 'Commit message' }).fill('Add app')
  await section(page).getByRole('button', { name: 'Commit', exact: true }).click()
  await expect(section(page).getByRole('textbox', { name: 'Commit message' })).toHaveValue('')
  await section(page).getByRole('button', { name: 'Push' }).click()
})

Then('the remote has my commit', async ({ folder }) => {
  await expect
    .poll(() => git(remoteOf(folder), 'log', '-1', '--format=%s', 'main').toString().trim())
    .toBe('Add app')
})

When('the remote gets another commit and I pull', async ({ page, folder }) => {
  const other = folder('other')
  git(other, 'clone', remoteOf(folder), '.')
  git(other, 'config', 'user.name', 'Tester')
  git(other, 'config', 'user.email', 'tester@example.com')
  write(other, 'remote.txt', 'hi\n')
  git(other, 'add', '.')
  git(other, 'commit', '-m', 'From remote')
  git(other, 'push')
  await section(page).getByRole('button', { name: 'Pull' }).click()
})

Then('my branch has it', async ({ folder }) => {
  await expect
    .poll(() => git(folder('api-service'), 'log', '-1', '--format=%s').toString().trim())
    .toBe('From remote')
})

Given('the branch {string} exists', async ({ folder }, branch: string) => {
  git(folder('api-service'), 'branch', branch)
})

When('I switch to the branch {string}', async ({ page }, branch: string) => {
  await section(page).getByRole('combobox', { name: 'Branch' }).selectOption(branch)
})

Then('the Git section shows branch {string}', async ({ page }, branch: string) => {
  await expect(section(page).getByRole('combobox', { name: 'Branch' })).toHaveValue(branch)
})

Then('the branch switcher is disabled', async ({ page }) => {
  await expect(section(page).getByRole('combobox', { name: 'Branch' })).toBeDisabled()
})

Then('stage, commit, push and pull are enabled', async ({ page }) => {
  const s = section(page)
  await expect(s.getByRole('button', { name: 'Stage src/app.ts' })).toBeEnabled()
  await s.getByRole('button', { name: 'Stage src/app.ts' }).click()
  await s.getByRole('textbox', { name: 'Commit message' }).fill('x')
  await expect(s.getByRole('button', { name: 'Commit', exact: true })).toBeEnabled()
  await expect(s.getByRole('button', { name: 'Push' })).toBeEnabled()
  await expect(s.getByRole('button', { name: 'Pull' })).toBeEnabled()
})

Then('the banner says {string}', async ({ page }, text: string) => {
  await expect(section(page).getByRole('status')).toContainText(text)
})

Given('the remote rejects pushes', async ({ folder }) => {
  const dir = folder('api-service')
  const remote = remoteOf(folder)
  git(remote, 'init', '--bare', '-b', 'main')
  git(dir, 'remote', 'add', 'origin', remote)
  git(dir, 'push', '-u', 'origin', 'main')
  const hook = join(remote, 'hooks/pre-receive')
  writeFileSync(hook, '#!/bin/sh\necho "rejected by test" >&2\nexit 1\n', { mode: 0o755 })
  git(dir, 'commit', '-am', 'Local only')
})

When('I push', async ({ page }) => {
  await section(page).getByRole('button', { name: 'Push' }).click()
})

Then("an error strip shows git's message", async ({ page }) => {
  await expect(section(page).getByRole('alert')).toContainText('rejected by test')
})

When('an agent edits {string}', async ({ folder }, path: string) => {
  write(folder('api-service'), path, 'export const b = 1\n')
})

Given(
  'the Project {string} is open and is not a git repository',
  async ({ page, folder }, name: string) => {
    await page.evaluate((p) => window.api.invoke('projects:open', p, false), folder(name))
  },
)

Then('the Git icon is greyed', async ({ page }) => {
  await expect(section(page)).toHaveAttribute('data-repo', 'false')
})

When('I click {string}', async ({ page }, name: string) => {
  await section(page).getByRole('button', { name }).click()
})

Given('a pre-commit hook rejects commits', async ({ folder }) => {
  const hook = join(folder('api-service'), '.git/hooks/pre-commit')
  writeFileSync(hook, '#!/bin/sh\necho "rejected by test" >&2\nexit 1\n', { mode: 0o755 })
})

Then('the commit message is still {string}', async ({ page }, message: string) => {
  await expect(section(page).getByRole('textbox', { name: 'Commit message' })).toHaveValue(message)
})

Given('HEAD is detached', async ({ folder }) => {
  git(folder('api-service'), 'checkout', '-q', '--detach')
})

Then('the Git section shows the short sha as branch', async ({ page, folder }) => {
  const sha = git(folder('api-service'), 'rev-parse', '--short', 'HEAD').toString().trim()
  const branch = section(page).getByRole('combobox', { name: 'Branch' })
  await expect(branch).toHaveValue(sha)
  await expect(branch.locator('option', { hasText: '(HEAD detached' })).toHaveCount(0)
})
