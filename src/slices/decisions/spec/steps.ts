import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { expect, type Page } from '@playwright/test'
import { asks, check, inform, OPTIONS, QUESTION, request } from '../../../shared/testing/fake-agent'
import { Given, Then, When } from '../../../shared/testing/fixtures'
import { type Decision, serialize } from '../model'

Given('Run {string} is running on the fake adapter', async ({ page }, id: string) => {
  await page.evaluate(() => window.api.invoke('runs:create'))
  await page.evaluate((i) => window.api.invoke('runs:start', i), id)
})

// Scope routing is TASK-7: until then the config only records what the human takes.
Given('I take {string} personally', async ({ folder }, scope: string) => {
  const dir = join(folder('api-service'), '.decisions')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'config.json'), JSON.stringify({ scopes: [{ name: scope, mine: true }] }))
})

When(
  'agent {string} requests an {string} Decision with options 1 and 2, recommending 1',
  async ({ page }, agent: string, scope: string) => {
    await request(page, 'R1', agent, scope)
  },
)

Then(
  'a card shows the Scope, the asking agent, the question and both options',
  async ({ page }) => {
    const card = page.getByRole('article')
    await expect(card).toContainText('Architecture')
    await expect(card).toContainText('orchestrator › api-agent')
    await expect(card).toContainText(QUESTION)
    for (const o of OPTIONS) await expect(card).toContainText(o)
  },
)

Then('the recommended option is marked', async ({ page }) => {
  await expect(page.getByRole('article').getByRole('img', { name: 'Recommended' })).toBeVisible()
})

Then('the agent is blocked', async ({ page }) => {
  await page.waitForTimeout(300)
  expect(asks.get(page)?.every((a) => !a.settled)).toBe(true)
})

Then('the tab badge increases', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'api-service' }).getByRole('status')).toHaveText('1')
})

Given('a pending Decision recommending 1', async ({ page }) => {
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
})

When(/^I press (Esc|[A-Z0-9])$/, async ({ page }, key: string) => {
  await page.keyboard.press(key === 'Esc' ? 'Escape' : key)
})

Then('the agent receives approval of {word}', async ({ page }, option: string) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe(`Approved: ${option}`)
})

Then('the card leaves the Feed', async ({ page }) => {
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then(
  '{string} records the Verdict with {string}',
  async ({ folder }, file: string, line: string) => {
    expect(readFileSync(join(folder('api-service'), file), 'utf8')).toContain(line)
  },
)

Then('the agent receives {string}', async ({ page }, text: string) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe(`Rejected: ${text}`)
})

const typed = new WeakMap<Page, string>()

Given('a pending Decision', async ({ page }) => {
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
})

When('I type {string} and press Enter', async ({ page }, text: string) => {
  typed.set(page, text)
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
})

Then('the comment box hints {string}', async ({ page }, hint: string) => {
  await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveAttribute('placeholder', hint)
})

Then('option {int} offers {string}', async ({ page }, n: number, title: string) => {
  await expect(
    page.getByRole('article').getByRole('button', { name: new RegExp(`^${n} `) }),
  ).toHaveAttribute('title', title)
})

Then('the card offers no {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article').getByRole('button', { name })).toHaveCount(0)
})

// Empty states; the Feed is the view already shown.
Then(/^the (Feed|Review|History) says "(.*)"$/, async ({ page }, view: string, text: string) => {
  if (view !== 'Feed') await page.getByRole('button', { name: view }).click()
  await expect(page.getByRole('region', { name: view })).toHaveText(text)
})

Then('History tags {word} {string}', async ({ page }, id: string, tag: string) => {
  await page.getByRole('button', { name: 'History' }).click()
  const rows = page.getByRole('region', { name: 'History' }).getByRole('listitem')
  await expect(rows.filter({ has: page.getByText(id, { exact: true }) })).toContainText(tag)
})

When('I press C and then Esc', async ({ page }) => {
  await page.keyboard.press('c')
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  await page.keyboard.press('Escape')
})

// Cmd+1 moves focus to the sidebar, so the comment input blurs.
When('I press C and then Cmd+1', async ({ page }) => {
  await page.keyboard.press('c')
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  await page.keyboard.press('Meta+1')
})

When('I press C, type {string} and press Cmd+1', async ({ page }, text: string) => {
  await page.keyboard.press('c')
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  await page.keyboard.type(text)
  await page.keyboard.press('Meta+1')
})

Then('the comment box still holds {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue(text)
})

Then('the agent receives that direction', async ({ page }) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe(`Direction: ${typed.get(page)}`)
})

Then('the Decision stays pending', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveCount(0)
  await expect(page.getByRole('article')).toHaveCount(1)
  expect(asks.get(page)?.every((a) => !a.settled)).toBe(true)
})

Given('Decisions D1 and D2 are pending', async ({ page }) => {
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article', { name: 'D1' })).toBeVisible()
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article', { name: 'D2' })).toBeVisible()
})

When('I give a Verdict on D1', async ({ page }) => {
  await page.keyboard.press('l')
  await expect(page.getByRole('article', { name: 'D1' })).toHaveCount(0)
})

Then('only D1 shows its actions', async ({ page }) => {
  const like = (id: string) =>
    page.getByRole('article', { name: id }).getByRole('button', { name: 'Like', exact: true })
  await expect(like('D1')).toBeVisible()
  await expect(like('D2')).toBeHidden()
})

When('{int} minutes pass', async ({ page }, minutes: number) => {
  await page.clock.install()
  await page.clock.fastForward(minutes * 60_000)
})

Then('the card shows {string} waited', async ({ page }, text: string) => {
  await expect(page.getByRole('article').getByRole('timer')).toHaveText(text)
})

Then('D2 is focused', async ({ page }) => {
  await expect(page.getByRole('article', { name: 'D2' })).toHaveAttribute('aria-current', 'true')
})

When('I give a Verdict on a pending Decision', async ({ page }) => {
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.keyboard.press('l')
})

Then('it appears in History', async ({ page }) => {
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('region', { name: 'History' }).getByText(QUESTION)).toBeVisible()
})

Given('a Decision is pending and its Run is stopped', async ({ page }) => {
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.evaluate(() => window.api.invoke('runs:stop', 'R1'))
  await expect(page.getByRole('button', { name: 'R1 · stopped' })).toBeVisible()
})

When('I give a Verdict', async ({ page }) => {
  await page.keyboard.press('l')
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then('{string} records it', async ({ folder }, file: string) => {
  expect(readFileSync(join(folder('api-service'), file), 'utf8')).toContain('status: answered')
})

Then('the next Run is pointed at {string}', async ({ page }, path: string) => {
  await page.getByRole('button', { name: 'New Run' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(path)
})

function setScope(folder: (n: string) => string, setting: object) {
  const dir = join(folder('api-service'), '.decisions')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'config.json'), JSON.stringify({ scopes: [setting] }))
}

Given('I do not take {string} personally', async ({ folder }, scope: string) => {
  setScope(folder, { name: scope, mine: false })
})

When(
  'an agent requests a {string} Decision recommending {int}',
  async ({ page }, scope: string, n: number) => {
    await request(page, 'R1', 'orchestrator > api-agent', scope, n - 1)
  },
)

Then('the agent receives {int} at once', async ({ page }, n: number) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe(`Approved: ${n}`)
})

Then('the Feed has no card', async ({ page }) => {
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then(
  '{string} records {string} with reason {string}',
  async ({ folder }, file: string, by: string, reason: string) => {
    const text = readFileSync(join(folder('api-service'), file), 'utf8')
    expect(text).toContain(by)
    expect(text).toContain(`reason: ${reason}`)
  },
)

Then('Review lists D1 and its badge increases', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Review' }).getByRole('status')).toHaveText('1')
  await page.getByRole('button', { name: 'Review' }).click()
  await expect(page.getByRole('region', { name: 'Review' })).toContainText('D1')
})

Given(
  'I take {string} personally with a {word} timeout',
  async ({ folder }, scope: string, timeout: string) => {
    setScope(folder, { name: scope, mine: true, timeout })
  },
)

const minutes = (t: string) => Number.parseInt(t, 10) * (t.endsWith('h') ? 60 : 1)

When(
  'an agent requests a {string} Decision and {word} pass',
  async ({ page }, scope: string, t: string) => {
    await request(page, 'R1', 'orchestrator > api-agent', scope)
    await expect(page.getByRole('article')).toHaveCount(1)
    await page.evaluate((m) => window.api.invoke('decisions:advance', m), minutes(t))
  },
)

Then('the agent receives its recommendation', async ({ page }) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toBe('Approved: 1')
})

Then('the file records reason {string}', async ({ folder }, reason: string) => {
  expect(readFileSync(join(folder('api-service'), '.decisions', 'D1.md'), 'utf8')).toContain(
    `reason: ${reason}`,
  )
})

Given('two pending Decisions with {word} timeouts', async ({ page, folder }, t: string) => {
  setScope(folder, { name: 'Architecture', mine: true, timeout: t })
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(2)
})

When('I open the comment box on one and {word} pass', async ({ page }, t: string) => {
  await page.keyboard.press('c')
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  await page.evaluate((m) => window.api.invoke('decisions:advance', m), minutes(t))
})

Then('both are still pending', async ({ page }) => {
  await expect(page.getByRole('article')).toHaveCount(2)
})

Then('the timers resume', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveCount(0)
  await page.evaluate(() => window.api.invoke('decisions:advance', 30))
  await expect(page.getByRole('article')).toHaveCount(0)
})

Given('a pending Decision with a timeout', async ({ page, folder }) => {
  setScope(folder, { name: 'Architecture', mine: true, timeout: '30m' })
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture')
  await expect(page.getByRole('article')).toHaveCount(1)
})

When('I close and relaunch the app', async ({ session }) => {
  await session.relaunch()
})

Then('the Decision is still pending and not Auto-resolved', async ({ session, folder }) => {
  const page = session.page
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.evaluate(() => window.api.invoke('decisions:advance', 60))
  await expect(page.getByRole('article')).toHaveCount(1)
  const text = readFileSync(join(folder('api-service'), '.decisions', 'D1.md'), 'utf8')
  expect(text).toContain('status: pending')
  expect(text).not.toContain('by: auto')
})

Given('Review has an unseen Auto-resolved Decision D1', async ({ page, folder }) => {
  setScope(folder, { name: 'Dependencies', mine: false })
  await request(page, 'R1', 'orchestrator > api-agent', 'Dependencies')
  await expect(page.getByRole('button', { name: 'Review' }).getByRole('status')).toHaveText('1')
})

When('I accept D1', async ({ page }) => {
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Accept D1' }).click()
})

Then('the Review badge decreases', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Review' }).getByRole('status')).toHaveCount(0)
})

// Overturn: past Decisions are written straight into .decisions/.
function seed(folder: (n: string) => string, d: Partial<Decision> & { id: number }) {
  const dir = join(folder('api-service'), '.decisions')
  mkdirSync(dir, { recursive: true })
  const text = serialize({
    scope: 'architecture',
    status: 'answered',
    agent: 'orchestrator > api-agent',
    question: QUESTION,
    options: OPTIONS,
    recommended: 0,
    verdict: 'Approved: 1',
    ...d,
  })
  writeFileSync(join(dir, `D${d.id}.md`), text)
  return join(dir, `D${d.id}.md`)
}

const overturn = async (page: Page, view: 'Review' | 'History', id: number) => {
  await page.getByRole('button', { name: view }).click()
  await page.getByRole('button', { name: `Overturn D${id}` }).click()
}

const pick = (page: Pick<Page, 'getByRole'>, n: number) =>
  page.getByRole('button', { name: new RegExp(`^${n} `) })

Given('Auto-resolved Decision D5 chose 1 over 2', async ({ folder }) => {
  seed(folder, { id: 5, by: 'auto', reason: 'timeout' })
})

When('I overturn D5 in Review', async ({ page }) => {
  await overturn(page, 'Review', 5)
})

Then(
  'a new pending Decision D6 with the same question and options opens with a comment box',
  async ({ page }) => {
    const card = page.getByRole('article', { name: 'D6' })
    await expect(card).toContainText(QUESTION)
    for (const o of OPTIONS) await expect(card).toContainText(o)
    await expect(card.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  },
)

Then('D5 is still not superseded', async ({ page }) => {
  await page.getByRole('button', { name: 'Review' }).click()
  await expect(page.getByRole('region', { name: 'Review' })).not.toContainText('superseded')
})

Given('I overturned D5 as D6', async ({ page }) => {
  await overturn(page, 'Review', 5)
  await expect(page.getByRole('article', { name: 'D6' })).toBeVisible()
})

When('I pick 2 on D6', async ({ page }) => {
  await pick(page.getByRole('article', { name: 'D6' }), 2).click()
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then('D5 shows struck through with {string}', async ({ page }, text: string) => {
  await page.getByRole('button', { name: 'Review' }).click()
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review.locator('s')).toHaveText('D5')
  await expect(review).toContainText(text)
})

Then('{string} has {string}', async ({ folder }, file: string, line: string) => {
  expect(readFileSync(join(folder('api-service'), file), 'utf8')).toContain(line)
})

When('I overturn D5 again', async ({ page, folder }) => {
  await page.getByRole('button', { name: 'Review' }).click()
  await expect(page.getByRole('button', { name: 'Overturn D5' })).toBeDisabled()
  // The guard in main, past the disabled button.
  await page.evaluate((p) => window.api.invoke('decisions:overturn', p, 5), folder('api-service'))
})

Then('only D6 is pending and Overturn D5 is disabled', async ({ page, folder }) => {
  await expect(page.getByRole('button', { name: 'Overturn D5' })).toHaveAttribute(
    'title',
    'Overturn pending',
  )
  expect(existsSync(join(folder('api-service'), '.decisions', 'D7.md'))).toBe(false)
  await page.getByRole('button', { name: 'Feed' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
})

Given('D1 is pending', async ({ page, folder }) => {
  seed(folder, { id: 1, status: 'pending', asked: Date.now(), verdict: undefined })
  await page.evaluate((p) => window.api.invoke('decisions:touch', p), folder('api-service'))
  await expect(page.getByRole('article', { name: 'D1' })).toBeVisible()
})

Then('D6 is focused with a comment box', async ({ page }) => {
  const card = page.getByRole('article', { name: 'D6' })
  await expect(card).toHaveAttribute('aria-current', 'true')
  await expect(card.getByRole('textbox', { name: 'Comment' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'D1' })).toHaveAttribute('aria-current', 'false')
})

Given('I started overturning D5', async ({ page }) => {
  await overturn(page, 'Review', 5)
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
})

Then('D5 is unchanged', async ({ page, folder }) => {
  await expect(page.getByRole('article')).toHaveCount(0)
  expect(existsSync(join(folder('api-service'), '.decisions', 'D6.md'))).toBe(false)
  await page.getByRole('button', { name: 'Review' }).click()
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).not.toContainText('superseded')
  await expect(review.getByRole('button', { name: 'Overturn D5' })).toBeVisible()
})

Given('D3 was answered by me', async ({ folder }) => {
  seed(folder, { id: 3, by: 'human' })
})

When('I overturn D3 in History', async ({ page }) => {
  await overturn(page, 'History', 3)
})

Then('a linked pending Decision opens', async ({ page, folder }) => {
  await expect(page.getByRole('article', { name: 'D6' }).getByRole('textbox')).toBeVisible()
  expect(readFileSync(join(folder('api-service'), '.decisions', 'D6.md'), 'utf8')).toContain(
    'supersedes: D3',
  )
})

// D7 is filler so the next ID is D8.
Given('D6 superseded D5', async ({ folder }) => {
  seed(folder, { id: 6, by: 'human', supersedes: 5 })
  seed(folder, { id: 7, by: 'human' })
})

When('I overturn D6 as D8', async ({ page }) => {
  await overturn(page, 'History', 6)
  await pick(page.getByRole('article', { name: 'D8' }), 2).click()
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then('D6 is superseded by D8 and D8 is the active one', async ({ page }) => {
  await page.getByRole('button', { name: 'History' }).click()
  const rows = page.getByRole('region', { name: 'History' }).getByRole('listitem')
  await expect(rows.filter({ hasText: 'D6' }).first()).toContainText('superseded by D8')
  await expect(rows.filter({ hasText: 'D8' }).first()).not.toContainText('superseded')
})

Given('D5 is Superseded', async ({ folder }) => {
  seed(folder, { id: 6, by: 'human', supersedes: 5 })
})

Then('D5 offers no overturn', async ({ page }) => {
  await page.getByRole('button', { name: 'Review' }).click()
  await expect(page.getByRole('region', { name: 'Review' })).toContainText('superseded by D6')
  await expect(page.getByRole('button', { name: 'Overturn D5' })).toHaveCount(0)
})

Given('the asking Run of D5 is still running', async ({ page }) => {
  await page.evaluate(() => window.api.invoke('runs:create'))
  await page.evaluate(() => window.api.invoke('runs:start', 'R1'))
})

When('I complete an overturn', async ({ page }) => {
  await overturn(page, 'Review', 5)
  await pick(page.getByRole('article', { name: 'D6' }), 2).click()
  await expect(page.getByRole('article')).toHaveCount(0)
})

Then('the agent receives nothing', async ({ page }) => {
  await page.waitForTimeout(300)
  expect(asks.get(page) ?? []).toHaveLength(0)
})

Then(
  'History lists answered, Auto-resolved and Superseded Decisions newest first',
  async ({ page, folder }) => {
    seed(folder, { id: 1, by: 'human' })
    seed(folder, { id: 2, by: 'auto', reason: 'out-of-scope' })
    seed(folder, { id: 4, by: 'human', supersedes: 2 })
    await page.getByRole('button', { name: 'History' }).click()
    const rows = page.getByRole('region', { name: 'History' }).getByRole('listitem')
    await expect(rows).toHaveCount(4)
    const ids = (await rows.allTextContents()).map((t) => /^D(\d+)/.exec(t)?.[1])
    expect(ids).toEqual(['5', '4', '2', '1'])
    await expect(rows.nth(2)).toContainText('superseded by D4')
  },
)

const order = async (page: Page) =>
  page.getByRole('article').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))

Then('the Feed lists {word} before {word}', async ({ page }, a: string, b: string) => {
  await expect.poll(() => order(page)).toEqual([a, b])
})

When('I toggle the Feed order', async ({ page }) => {
  await page.getByRole('button', { name: /first$/ }).click()
})

Then('{word} leaves the Feed', async ({ page }, id: string) => {
  await expect(page.getByRole('article', { name: id })).toHaveCount(0)
})

// Decision components: Groma Component ids a Decision touches.
Given(
  'its {string} has the Components {string} and {string}',
  async ({ folder }, dir: string, a: string, b: string) => {
    for (const id of [a, b]) {
      const d = join(folder('api-service'), dir, 'components')
      mkdirSync(d, { recursive: true })
      writeFileSync(
        join(d, `${id}.md`),
        `---\ntype: C4 Component\ntitle: ${id}\ngroma:\n  id: ${id}\n  parent: api\n---\n`,
      )
    }
  },
)

const started = new WeakSet<Page>()
const ensureRun = async (page: Page) => {
  if (started.has(page)) return
  started.add(page)
  await page.evaluate(() => window.api.invoke('runs:create'))
  await page.evaluate(() => window.api.invoke('runs:start', 'R1'))
}

When('a Run starts', async ({ page }) => ensureRun(page))

Then(
  'the request_decision tool lists {string} and {string}',
  async ({ page }, a: string, b: string) => {
    const url = (await page.evaluate(() => window.api.invoke('agent:mcp-url'))) as string
    const client = new Client({ name: 'test-agent', version: '0.0.0' })
    await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/R1`)))
    const { tools } = await client.listTools()
    const props = tools.find((t) => t.name === 'request_decision')?.inputSchema
      .properties as Record<string, { description?: string }>
    expect(props.components?.description).toContain(a)
    expect(props.components?.description).toContain(b)
    await client.close()
  },
)

const touching = async (page: Page, ids: string[]) => {
  await ensureRun(page)
  await request(page, 'R1', 'orchestrator > api-agent', 'Architecture', 0, ids)
  await expect(page.getByRole('article')).toHaveCount(1)
}

When('an agent requests a Decision touching {string}', async ({ page }, a: string) => {
  await touching(page, [a])
})

When(
  'an agent requests a Decision touching {string} and {string}',
  async ({ page }, a: string, b: string) => {
    await touching(page, [a, b])
  },
)

When('an agent requests a Decision with no components', async ({ page }) => {
  await touching(page, [])
})

const recordsComponent = async ({ folder }: { folder: (name: string) => string }, id: string) => {
  expect(readFileSync(join(folder('api-service'), '.decisions', 'D1.md'), 'utf8')).toContain(
    `components: ${id}\n`,
  )
}
Then('its file records the component {string}', recordsComponent)
Then('its file records only {string}', recordsComponent)

Given('D1 touches {string}', async ({ folder }, id: string) => {
  seed(folder, { id: 1, by: 'human', components: [id] })
})

When('I overturn D1', async ({ page }) => {
  await overturn(page, 'History', 1)
})

Then('the new Decision touches {string}', async ({ folder }, id: string) => {
  expect(readFileSync(join(folder('api-service'), '.decisions', 'D2.md'), 'utf8')).toContain(
    `components: ${id}\n`,
  )
})

When('the agent disconnects', async ({ page }) => {
  await asks.get(page)?.[0]?.client.close()
})

Then('the card is marked {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('article').getByRole('img', { name })).toBeVisible()
})

When('Run {string} is started', async ({ page }, id: string) => {
  await page.evaluate(() => window.api.invoke('runs:create'))
  await page.evaluate((i) => window.api.invoke('runs:start', i), id)
})

Then('the terminal of {string} says {string}', async ({ page }, _id: string, text: string) => {
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText(text)
})

Then(
  'the terminal of {string} does not say {string}',
  async ({ page }, _id: string, text: string) => {
    await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('Past Decisions')
    await expect(page.getByRole('log', { name: 'Terminal' })).not.toContainText(text)
  },
)

When(
  'agent {string} parks an {string} Decision, recommending 1',
  async ({ page }, agent: string, scope: string) => {
    await request(page, 'R1', agent, scope, 0, undefined, undefined, 'soft')
  },
)

Then('the agent immediately receives {string}', async ({ page }, text: string) => {
  await expect.poll(() => asks.get(page)?.[0]?.result).toContain(text)
})

Then('the card is not marked {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article').getByRole('img', { name })).toHaveCount(0)
})

Then(
  'checking Decisions as {string} returns {string}',
  async ({ page }, run: string, text: string) => {
    expect(await check(page, run)).toContain(text)
  },
)

When(
  'the agent informs {string} because {string}',
  async ({ page }, summary: string, reason: string) => {
    await inform(page, 'R1', summary, reason)
  },
)

const refused = new WeakMap<Page, { isError: boolean; text: string }>()

When('the agent informs {int} times in a row', async ({ page }, n: number) => {
  refused.set(page, await inform(page, 'R1', 'Did a thing', 'It was obvious', n))
})

Then('the last inform is refused with {string}', async ({ page }, text: string) => {
  expect(refused.get(page)?.isError).toBe(true)
  expect(refused.get(page)?.text).toContain(text)
})
