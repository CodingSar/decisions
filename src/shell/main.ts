import { join } from 'node:path'
import { app, BrowserWindow, clipboard, ipcMain, Menu, shell } from 'electron'
import {
  ensurePlugin,
  type RuntimeKind,
  setRuntime,
  startMcpServer,
} from '../slices/agent-runtimes/main'
import { componentIds, registerArchitecture } from '../slices/architecture/main'
import { registerDecisions } from '../slices/decisions/main'
import { registerFiles } from '../slices/files/main'
import { registerMockups } from '../slices/mockups/main'
import { registerProjects } from '../slices/projects/main'
import { registerRuns } from '../slices/runs/main'
import { registerScopes, scopeNames, scopeSettings } from '../slices/scopes/main'
import { registerLayout } from './layout'

// Tests give each scenario its own user data dir so a relaunch restores that scenario's tabs.
if (process.env.DECISIONS_USER_DATA) app.setPath('userData', process.env.DECISIONS_USER_DATA)

const SETUP =
  'Set up this project. Run `backlog init`, `groma init` and `tessl init` for each of backlog/, groma/ and tessl.json that is missing. Then use the grilling skill to interview me about the design, and write GLOSSARY.md and ADRs with the domain-modeling skill.'

let decisions: ReturnType<typeof registerDecisions>
let runs: ReturnType<typeof registerRuns>
let projectOf: (runId: string) => string | undefined = () => undefined
let projectAt: (dir: string) => string | undefined = () => undefined

// Sessions started in a terminal have no Run: their pseudo Run id carries the Project folder.
const TERMINAL = 'terminal:'

async function startMcp() {
  const mcp = await startMcpServer(
    (req, runId) => decisions.request(req, runId),
    (runId) => {
      const project = projectOf(runId)
      return project ? scopeNames(project) : []
    },
    (runId) => {
      const project = projectOf(runId)
      return project ? componentIds(project) : []
    },
    (dir) => {
      const project = projectAt(dir)
      return project && TERMINAL + project
    },
    process.env.DECISIONS_MCP_PORT ? Number(process.env.DECISIONS_MCP_PORT) : undefined,
  )
  ipcMain.handle('agent:mcp-url', () => mcp.url)
  // Test hook: only exists when the harness picked a runtime by env.
  if (process.env.DECISIONS_RUNTIME) {
    ipcMain.handle('agent:use-runtime', (_e, kind: RuntimeKind) => setRuntime(kind))
    ipcMain.handle('agent:env', (_e, patch: Record<string, string>) => {
      Object.assign(process.env, patch)
    })
  }
  app.on('will-quit', mcp.close)
  return mcp.url
}

function createWindow(mcpUrl: string) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Decisions',
    webPreferences: { preload: join(import.meta.dirname, '../preload/index.cjs'), sandbox: false },
  })
  const files = registerFiles(win)
  const projects = registerProjects(
    win,
    async (path) => {
      const why = await ensurePlugin(path)
      runs.startRun(
        why ? `${SETUP} (The grilling skill is unavailable; interview me directly.)` : SETUP,
        why && `mattpocock-skills could not be installed (${why}). Setup continues without it.`,
      )
    },
    (path) => {
      runs.stopProject(path)
      files.stop(path)
    },
  )
  runs = registerRuns(win, projects.active, mcpUrl, projects.focus)
  projectOf = (id) => (id.startsWith(TERMINAL) ? id.slice(TERMINAL.length) : runs.projectOf(id))
  projectAt = projects.containing
  decisions = registerDecisions(
    win,
    projectOf,
    (project, scope) => {
      const s = scopeSettings(project).find((x) => x.name.toLowerCase() === scope.toLowerCase())
      return s ?? { mine: true } // an unknown Scope counts as In-Scope
    },
    runs.mark,
  )
  registerScopes()
  registerMockups()
  registerLayout()
  // Terminal tools: links open in the browser, the clipboard is the system one.
  ipcMain.handle('shell:open', (_e, url: string) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
  })
  ipcMain.handle('clipboard:read', () => clipboard.readText())
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(text))
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null) // no File/Edit/View/Window bar
  registerArchitecture(() =>
    runs.startRun('Curate the architecture: run `groma agent-instructions` and follow it'),
  )
  createWindow(await startMcp())
})
app.on('window-all-closed', () => app.quit())
