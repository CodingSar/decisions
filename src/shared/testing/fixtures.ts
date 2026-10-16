import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type ElectronApplication, _electron as electron, type Page } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'
import { asks } from './fake-agent'

interface Session {
  page: Page
  /** Every window this session has opened (one per launch). */
  pages: Page[]
  relaunch(): Promise<void>
}

const tmp = () => mkdtempSync(join(tmpdir(), 'decisions-'))

export const test = base.extend<{
  session: Session
  folder: (name: string) => string
  closeFakeAgents: undefined
}>({
  // Launches the built app (run `electron-vite build` first); one fresh app and user data dir per scenario.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
  session: async ({}, use) => {
    const userData = tmp()
    let app: ElectronApplication | undefined
    const session = {
      page: undefined as unknown as Page,
      pages: [] as Page[],
      async relaunch() {
        await app?.close()
        app = await electron.launch({
          args: ['.'],
          env: { ...process.env, DECISIONS_RUNTIME: 'fake', DECISIONS_USER_DATA: userData },
        })
        session.page = await app.firstWindow()
        session.pages.push(session.page)
      },
    }
    await session.relaunch()
    await use(session)
    await app?.close()
    rmSync(userData, { recursive: true, force: true })
  },
  page: async ({ session }, use) => use(session.page),
  // Closes the fake agent's MCP clients so unanswered asks cannot time out into a later scenario.
  closeFakeAgents: [
    async ({ session }, use) => {
      await use(undefined)
      await Promise.all(
        session.pages
          .flatMap((p) => asks.get(p) ?? [])
          .map((a) => a.client.close().catch(() => {})),
      )
    },
    { auto: true },
  ],
  // Creates (or returns) a named folder in this scenario's temp dir.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
  folder: async ({}, use) => {
    const root = tmp()
    await use((name) => {
      const dir = join(root, name)
      mkdirSync(dir, { recursive: true })
      return dir
    })
    rmSync(root, { recursive: true, force: true })
  },
})

export const { Given, When, Then } = createBdd(test)
