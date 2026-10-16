import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type ElectronApplication, _electron as electron, type Page } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'

interface Session {
  page: Page
  relaunch(): Promise<void>
}

const tmp = () => mkdtempSync(join(tmpdir(), 'decisions-'))

export const test = base.extend<{
  session: Session
  folder: (name: string) => string
}>({
  // Launches the built app (run `electron-vite build` first); one fresh app and user data dir per scenario.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
  session: async ({}, use) => {
    const userData = tmp()
    let app: ElectronApplication | undefined
    const session = {
      page: undefined as unknown as Page,
      async relaunch() {
        await app?.close()
        app = await electron.launch({
          args: ['.'],
          env: { ...process.env, DECISIONS_RUNTIME: 'fake', DECISIONS_USER_DATA: userData },
        })
        session.page = await app.firstWindow()
      },
    }
    await session.relaunch()
    await use(session)
    await app?.close()
  },
  page: async ({ session }, use) => use(session.page),
  // Creates (or returns) a named folder in this scenario's temp dir.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
  folder: async ({}, use) => {
    const root = tmp()
    await use((name) => {
      const dir = join(root, name)
      mkdirSync(dir, { recursive: true })
      return dir
    })
  },
})

export const { Given, When, Then } = createBdd(test)
