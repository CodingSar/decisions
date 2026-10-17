import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'
import { Given, Then, When } from '../../../shared/testing/fixtures'

const DAY = 24 * 3600_000

// Files written behind the app's back show up when main is told to report a change.
const touch = (page: Page, dir: string) =>
  page.evaluate((p) => window.api.invoke('decisions:touch', p), dir)

const element = (type: string, id: string, parent?: string) =>
  `---\ntype: C4 ${type}\ntitle: ${id}\ngroma:\n  id: ${id}\n${parent ? `  parent: ${parent}\n` : ''}---\n`

// One Container with its Components under the Project's `dir`.
function writeContainer(project: string, dir: string, container: string, ids: string[]) {
  const root = join(project, dir, 'containers', container)
  mkdirSync(join(root, 'components'), { recursive: true })
  writeFileSync(join(root, 'container.md'), element('Container', container))
  for (const id of ids)
    writeFileSync(join(root, 'components', `${id}.md`), element('Component', id, container))
}

Given(
  'its {string} has the Container {string} with the Components {string} and {string}',
  async ({ page, folder }, dir: string, container: string, a: string, b: string) => {
    writeContainer(folder('api-service'), dir, container, [a, b])
    await touch(page, folder('api-service'))
  },
)

// Written as an agent would, with no nudge: the app has to notice on its own.
When(
  '{string} gets a {string} with the Container {string} and the Components {string} and {string}',
  async ({ folder }, name: string, dir: string, container: string, a: string, b: string) => {
    writeContainer(folder(name), dir, container, [a, b])
  },
)

Given(
  "the Components {string} and {string} are each other's parent",
  async ({ page, folder }, a: string, b: string) => {
    const root = join(folder('api-service'), 'groma', 'loop')
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, `${a}.md`), element('Component', a, b))
    writeFileSync(join(root, `${b}.md`), element('Component', b, a))
    await touch(page, folder('api-service'))
  },
)

Given(
  '{string} belongs to the System {string}',
  async ({ page, folder }, c: string, sys: string) => {
    const root = join(folder('api-service'), 'groma')
    mkdirSync(join(root, 'systems', sys), { recursive: true })
    writeFileSync(join(root, 'systems', sys, 'system.md'), element('System', sys))
    writeFileSync(join(root, 'containers', c, 'container.md'), element('Container', c, sys))
    await touch(page, folder('api-service'))
  },
)

// A Relationships row in a's file; both live in the same components/ folder.
Given('{string} uses {string}', async ({ page, folder }, a: string, b: string) => {
  const dir = join(folder('api-service'), 'groma', 'containers', 'main-process', 'components')
  writeFileSync(
    join(dir, `${a}.md`),
    `${element('Component', a, 'main-process')}\n## Relationships\n\n| Source | Target | Description | Technology |\n| --- | --- | --- | --- |\n| [${a}](./${a}.md) | [${b}](./${b}.md) | uses | |\n`,
  )
  await touch(page, folder('api-service'))
})

// Decisions are written straight into .decisions/.
interface Seed {
  id: number
  status: 'pending' | 'answered'
  components?: string[]
  /** Days since it was answered. */
  ago?: number
  supersedes?: number
}
async function seed(page: Page, dir: string, d: Seed) {
  const folder = join(dir, '.decisions')
  mkdirSync(folder, { recursive: true })
  const lines = [
    'scope: architecture',
    `status: ${d.status}`,
    d.status === 'pending'
      ? `asked: ${Date.now()}`
      : `answered: ${Date.now() - (d.ago ?? 0) * DAY}`,
    ...(d.status === 'answered' ? ['by: human'] : []),
    ...(d.supersedes ? [`supersedes: D${d.supersedes}`] : []),
    ...(d.components?.length ? [`components: ${d.components.join(', ')}`] : []),
  ]
  writeFileSync(
    join(folder, `D${d.id}.md`),
    `---\n${lines.join('\n')}\n---\n# Which storage?\n\nAsked by: orchestrator > api-agent\n\n- 1: Plain files ★\n- 2: SQLite\n${d.status === 'answered' ? '\n## Verdict\n\nApproved: 1\n' : ''}`,
  )
  await touch(page, dir)
}

Given('a pending Decision touches {string}', async ({ page, folder }, id: string) =>
  seed(page, folder('api-service'), { id: 1, status: 'pending', components: [id] }),
)

Given(
  'a pending Decision D{int} touches {string}',
  async ({ page, folder }, n: number, id: string) =>
    seed(page, folder('api-service'), { id: n, status: 'pending', components: [id] }),
)

Given('a pending Decision touches no Component', async ({ page, folder }) =>
  seed(page, folder('api-service'), { id: 1, status: 'pending' }),
)

Given(
  'an answered Decision from yesterday touches {string}',
  async ({ page, folder }, id: string) =>
    seed(page, folder('api-service'), { id: 1, status: 'answered', ago: 1, components: [id] }),
)

Given(
  'an answered Decision from {int} days ago touches {string}',
  async ({ page, folder }, days: number, id: string) =>
    seed(page, folder('api-service'), { id: 1, status: 'answered', ago: days, components: [id] }),
)

Given(
  'the Decision D1 touches {string} and is Superseded',
  async ({ page, folder }, id: string) => {
    await seed(page, folder('api-service'), { id: 1, status: 'answered', components: [id] })
    await seed(page, folder('api-service'), { id: 2, status: 'answered', supersedes: 1 })
  },
)

Given(
  'the Project {string} has no {string} folder',
  async ({ page, folder }, name: string, _dir: string) => {
    await page.evaluate((p) => window.api.invoke('projects:open', p, false), folder(name))
  },
)

// Frames hold nested tiles, so a click lands on the frame's own title.
async function tap(n: Locator) {
  const ttl = n.locator(':scope > text.ttl')
  if (await ttl.count()) await ttl.click()
  else await n.click()
}
const mini = (page: Page) => page.getByRole('region', { name: 'Decision map' })
const node = (page: Page, name: string) => mini(page).getByRole('button', { name, exact: true })

// The mini map starts at the top; drill into containers until the element is on screen.
async function reveal(page: Page, name: string) {
  await expect(mini(page).locator('[data-kind]').first()).toBeVisible() // the model has loaded
  for (let i = 0; i < 4; i++) {
    if (await node(page, name).count()) return node(page, name)
    const container = mini(page).locator('[data-kind="container"]').first()
    await expect(container).toBeVisible()
    await tap(container)
  }
  return node(page, name)
}

Then(
  'the mini map shows {string} glowing with count {int}',
  async ({ page }, name: string, count: number) => {
    const n = await reveal(page, name)
    await expect(n).toHaveAttribute('data-heat', 'pending')
    await expect(n).toHaveAttribute('data-count', String(count))
  },
)

Then('the mini map shows {string} glowing', async ({ page }, name: string) => {
  await expect(await reveal(page, name)).toHaveAttribute('data-heat', 'pending')
})

let last: string
Then('the mini map shows {string} tinted', async ({ page }, name: string) => {
  last = name
  await expect(await reveal(page, name)).toHaveAttribute('data-heat', 'recent')
})

Then('it has no count', async ({ page }) => {
  await expect(node(page, last)).not.toHaveAttribute('data-count', /.+/)
})

Then('the mini map shows {string} neutral', async ({ page }, name: string) => {
  await expect(await reveal(page, name)).toHaveAttribute('data-heat', 'none')
})

Then('no Component glows', async ({ page }) => {
  await expect(node(page, 'main-process')).toBeVisible()
  await expect(mini(page).locator('[data-heat="pending"]')).toHaveCount(0)
})

When('I hover {string} in the mini map', async ({ page }, name: string) => {
  await (await reveal(page, name)).hover()
})

Then('{word} is listed', async ({ page }, id: string) => {
  await expect(mini(page).getByRole('tooltip')).toContainText(id)
})

When('I click the expand icon', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Decision map' }).click()
})

Then('the Decision map modal covers the window', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: 'Decision map' })).toBeVisible()
})

Then('Escape closes it', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Decision map' })).toHaveCount(0)
})

Given('the Interactions view', async ({ page }) => {
  await mini(page).getByRole('button', { name: 'Interactions' }).click()
})

Then('the mini map shows {string} without its Components', async ({ page }, name: string) => {
  const n = await reveal(page, name)
  await expect(n).toBeVisible()
  await expect(n.locator('[data-kind]')).toHaveCount(0)
})

When('I click {string} in the mini map', async ({ page }, name: string) => {
  await tap(await reveal(page, name))
})

Then('the modal opens with {string} selected', async ({ page }, name: string) => {
  await expect(
    page.getByRole('dialog', { name: 'Decision map' }).getByRole('button', { name, pressed: true }),
  ).toBeVisible()
})

Then('the side panel lists {word}', async ({ page }, id: string) => {
  await expect(
    page.getByRole('dialog', { name: 'Decision map' }).getByRole('complementary'),
  ).toContainText(id)
})

Then('the side panel says {string}', async ({ page }, text: string) => {
  await expect(
    page.getByRole('dialog', { name: 'Decision map' }).getByRole('complementary'),
  ).toContainText(text)
})

When('I open {word} from the side panel', async ({ page }, id: string) => {
  await page
    .getByRole('dialog', { name: 'Decision map' })
    .getByRole('complementary')
    .getByRole('button')
    .filter({ hasText: id })
    .click()
})

Then('the modal closes', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: 'Decision map' })).toHaveCount(0)
})

// The Decision's card or row holds the focus, so it shows the ring.
Then('the {word} view shows {word} focused', async ({ page }, view: string, id: string) => {
  const el = page.getByRole('region', { name: view }).locator(`[aria-label="${id}"]`)
  await expect(el).toBeVisible()
  await expect.poll(() => el.evaluate((e) => e.contains(document.activeElement))).toBe(true)
})

Then('the map shows only {string} and {string}', async ({ page }, a: string, b: string) => {
  await expect(node(page, a)).toBeVisible()
  await expect(node(page, b)).toBeVisible()
  await expect(mini(page).locator('[data-kind]')).toHaveCount(2)
})

Then(
  'the mini map shows {string} containing {string} and {string}',
  async ({ page }, c: string, a: string, b: string) => {
    const box = node(page, c)
    await expect(box).toHaveAttribute('data-kind', 'container')
    await expect(box.getByRole('button', { name: a, exact: true })).toBeVisible()
    await expect(box.getByRole('button', { name: b, exact: true })).toBeVisible()
  },
)

Then('the mini map shows no arrows', async ({ page }) => {
  await expect(mini(page).locator('[data-kind]').first()).toBeVisible()
  await expect(mini(page).locator('[data-edge]')).toHaveCount(0)
})

Then('an arrow runs from {string} to {string}', async ({ page }, a: string, b: string) => {
  await expect(mini(page).locator(`[data-edge="${a}>${b}"]`)).toBeVisible()
})

Then('{string} and {string} stand out', async ({ page }, a: string, b: string) => {
  await expect(node(page, a)).not.toHaveAttribute('data-dim', /.*/)
  await expect(node(page, b)).not.toHaveAttribute('data-dim', /.*/)
})

Then('the listed row shows {string} as plain text', async ({ page }, text: string) => {
  const tip = mini(page).getByRole('tooltip')
  await expect(tip.locator('li').first()).toContainText(text)
  await expect(tip.getByRole('button')).toHaveCount(0)
})

Then('the map says {string} with a build button', async ({ page }, text: string) => {
  await expect(mini(page)).toContainText(text)
  await expect(mini(page).getByRole('button', { name: 'Build the map with a Run' })).toBeVisible()
})

When('I click the build button', async ({ page }) => {
  await mini(page).getByRole('button', { name: 'Build the map with a Run' }).click()
})

Then('a Run starts with a prompt to curate the architecture', async ({ page }) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('Curate the architecture')
})

Then(
  'the mini map control {string} has the tooltip {string}',
  async ({ page }, name: string, tip: string) => {
    await expect(mini(page).getByRole('button', { name, exact: true })).toHaveAttribute(
      'title',
      tip,
    )
  },
)

// Hover focus: rest past the 150 ms dwell until the map holds the focus (see shell steps `rest`).
Given('the mouse rests on the mini map', async ({ page }) => {
  await expect(mini(page).locator('[data-kind]').first()).toBeVisible()
  await expect
    .poll(async () => {
      await mini(page).hover()
      await page.waitForTimeout(250)
      return mini(page).evaluate((el) => el.contains(document.activeElement))
    })
    .toBe(true)
})

When('I press Backspace', async ({ page }) => {
  await page.keyboard.press('Backspace')
})
