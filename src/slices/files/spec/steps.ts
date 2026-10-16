import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../../../shared/testing/fixtures'

const write = (root: string, rel: string, text = '') => {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}

Given('it contains {string} and {string}', async ({ folder }, a: string, b: string) => {
  write(folder('api-service'), a, '# Use cases\n')
  write(folder('api-service'), b, '# Glossary\n')
})

Given('it contains {string}', async ({ folder }, a: string) => write(folder('api-service'), a))

Given('{string} lists {string}', async ({ folder }, file: string, entry: string) => {
  write(folder('api-service'), file, `${entry}\n`)
  write(folder('api-service'), 'dist/out.js')
  write(folder('api-service'), '.git/HEAD', 'ref: refs/heads/main\n')
})

Then('the Files section is directly under Runs', async ({ page }) => {
  await expect(page.locator('ul.runs + section[aria-label="Files"]')).toBeVisible()
})

Then('the tree shows {string} and {string}', async ({ page }, a: string, b: string) => {
  const tree = page.getByRole('region', { name: 'Files' })
  await expect(tree).toContainText(a)
  await expect(tree).toContainText(b)
})

Then('the tree hides {string} and {string}', async ({ page }, a: string, b: string) => {
  const tree = page.getByRole('region', { name: 'Files' })
  await expect(tree).toContainText('GLOSSARY.md') // loaded
  await expect(tree.getByText(a, { exact: true })).toHaveCount(0)
  await expect(tree.getByText(b, { exact: true })).toHaveCount(0)
})

const tree = (page: Page) => page.getByRole('region', { name: 'Files' })
const view = (page: Page) => page.getByRole('region', { name: 'Files view' })

// Folders start closed: open the ancestors of `path` as the human would.
const open = async (page: Page, path: string) => {
  const dirs = path.split('/').slice(0, -1)
  for (let i = 1; i <= dirs.length; i++) {
    const folder = tree(page).getByRole('button', { name: dirs.slice(0, i).join('/'), exact: true })
    if ((await folder.getAttribute('aria-expanded')) === 'false') await folder.click()
  }
  await tree(page).getByRole('button', { name: path, exact: true }).click()
}

When('I click {string} in the tree', async ({ page }, path: string) => open(page, path))

When('I open {string}', async ({ page, folder }, path: string) => {
  // `.decisions/` Decision files are seeded on demand.
  const file = join(folder('api-service'), path)
  if (path.startsWith('.decisions/') && !existsSync(file))
    write(folder('api-service'), path, '# D1\n')
  await open(page, path)
})

Given('{string} links to {string}', async ({ page, folder }, path: string, href: string) => {
  write(folder('api-service'), path, `# Links\n\n[go](${href})\n`)
  await open(page, path)
  await expect(view(page).getByRole('link', { name: 'go' })).toBeVisible()
})

When('I click the link', async ({ page }) => {
  await view(page).getByRole('link', { name: 'go' }).click()
})

Then('the Files view shows it rendered', async ({ page }) => {
  await expect(view(page).getByRole('heading', { name: 'Use cases', level: 1 })).toBeVisible()
})

Then('I can toggle to the source', async ({ page }) => {
  await view(page).getByRole('button', { name: 'Source' }).click()
  await expect(view(page)).toContainText('# Use cases')
})

Then('the Files view shows {string}', async ({ page }, path: string) => {
  await expect(view(page).getByRole('heading', { name: path, exact: true, level: 2 })).toBeVisible()
})

Then('the Files view says {string}', async ({ page }, text: string) => {
  await expect(view(page).locator('.empty')).toHaveText(text)
})

Then('the system browser opens {string}', async ({ page }, url: string) => {
  await expect.poll(() => page.evaluate(() => window.api.invoke('files:last-external'))).toBe(url)
})

When('an agent creates {string}', async ({ folder }, path: string) =>
  write(folder('api-service'), path, '# New\n'),
)

Then('the tree shows {string}', async ({ page }, path: string) => {
  await expect(tree(page).getByRole('button', { name: path, exact: true })).toBeVisible()
})

Then('the editor is read-only', async ({ page }) => {
  // Markdown opens rendered; its editor is the source view.
  const source = view(page).getByRole('button', { name: 'Source' })
  if (await source.isVisible()) await source.click()
  await expect(view(page).locator('.code')).toHaveAttribute('data-readonly', 'true')
})

Then('there is no edit-anyway icon', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Edit anyway' })).toHaveCount(0)
})

When('I collapse {string}', async ({ page }, dir: string) => {
  const folder = tree(page).getByRole('button', { name: dir, exact: true })
  await expect(folder).toHaveAttribute('aria-expanded', 'true')
  await folder.click()
})

When('I collapse the Files section', async ({ page }) => {
  await page.getByRole('button', { name: 'Collapse Files' }).click()
})

When('I expand the Files section', async ({ page }) => {
  await page.getByRole('button', { name: 'Expand Files' }).click()
})

When('I expand {string}', async ({ page }, dir: string) => {
  const folder = tree(page).getByRole('button', { name: dir, exact: true })
  await expect(folder).toHaveAttribute('aria-expanded', 'false')
  await folder.click()
})

Then('the tree hides {string}', async ({ page }, path: string) => {
  await expect(tree(page).getByRole('button', { name: path, exact: true })).toHaveCount(0)
})

const editor = (page: Page) => view(page).locator('.monaco-editor')

const typeIn = async (page: Page) => {
  await editor(page).click()
  await page.keyboard.type('// edited\n')
}

When('I change it', async ({ page }) => typeIn(page))

// Inside the save debounce, so the write finds no file.
When('the file vanishes from disk', async ({ folder }) =>
  unlinkSync(join(folder('api-service'), 'src/app.ts')),
)

const status = (page: Page) => view(page).locator('.save-state')

Then('the status says {string}', async ({ page }, text: string) => {
  await expect(status(page)).toHaveText(text)
})

Then('the status is an error', async ({ page }) => {
  await expect(status(page)).toHaveAttribute('data-state', 'error')
})

Then('the file on disk has my change', async ({ folder }) => {
  const file = join(folder('api-service'), 'src/app.ts')
  await expect.poll(() => readFileSync(file, 'utf8')).toContain('// edited')
})

Given('the Run {string} is running', async ({ page }, id: string) => {
  // Create Runs until the wanted id exists.
  for (let i = 0; i < 10; i++) {
    if ((await page.evaluate(() => window.api.invoke('runs:create'))) === id) break
  }
  await page.evaluate((i) => window.api.invoke('runs:start', i), id)
  await expect(page.getByRole('button', { name: `${id} · running` })).toBeVisible()
})

Then('a banner says {string}', async ({ page }, text: string) => {
  await expect(view(page).getByRole('status')).toContainText(text)
})

When('I click the edit-anyway icon', async ({ page }) => {
  await view(page).getByRole('button', { name: 'Edit anyway' }).click()
})

Then('the editor is editable', async ({ page }) => {
  await expect(view(page).locator('.code')).toHaveAttribute('data-readonly', 'false')
})

When('I stop {string}', async ({ page }, id: string) => {
  await page.evaluate((i) => window.api.invoke('runs:stop', i), id)
})

Then('the banner is gone', async ({ page }) => {
  await expect(view(page).getByRole('status')).toHaveCount(0)
})

Given('{string} is open rendered', async ({ page, folder }, path: string) => {
  write(folder('api-service'), path, '# Plan\n')
  await open(page, path)
  await expect(view(page).getByRole('heading', { name: 'Plan', level: 1 })).toBeVisible()
})

When('I toggle to the source and change it', async ({ page }) => {
  await view(page).getByRole('button', { name: 'Source' }).click()
  await editor(page).click()
  await page.keyboard.type('# Edited ')
})

Then('the rendered view shows my change', async ({ page }) => {
  await view(page).getByRole('button', { name: 'Rendered' }).click()
  await expect(view(page).getByRole('heading', { name: /Edited/ })).toBeVisible()
})

Then('{string} on disk is still empty', async ({ folder }, path: string) => {
  await new Promise((r) => setTimeout(r, 700)) // outlast the 500ms save debounce
  expect(readFileSync(join(folder('api-service'), path), 'utf8')).toBe('')
})
