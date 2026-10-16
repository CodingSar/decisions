import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
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

const open = async (page: Page, path: string) => {
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
  await expect(view(page).locator('textarea')).toHaveAttribute('readonly', /.*/)
})

Then('there is no edit-anyway icon', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Edit anyway' })).toHaveCount(0)
})

When('I collapse {string}', async ({ page }, dir: string) => {
  const folder = tree(page).getByRole('button', { name: dir, exact: true })
  await expect(folder).toHaveAttribute('aria-expanded', 'true')
  await folder.click()
})

When('I expand {string}', async ({ page }, dir: string) => {
  const folder = tree(page).getByRole('button', { name: dir, exact: true })
  await expect(folder).toHaveAttribute('aria-expanded', 'false')
  await folder.click()
})

Then('the tree hides {string}', async ({ page }, path: string) => {
  await expect(tree(page).getByRole('button', { name: path, exact: true })).toHaveCount(0)
})
