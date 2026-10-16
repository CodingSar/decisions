import { join } from 'node:path'
import { app, BrowserWindow, clipboard, ipcMain, Menu, shell } from 'electron'
import { type RuntimeKind, setRuntime, startMcpServer } from '../slices/agent-runtimes/main'
import { componentIds, registerArchitecture } from '../slices/architecture/main'
import { registerDecisions } from '../slices/decisions/main'
import { registerFiles } from '../slices/files/main'
import { registerGit } from '../slices/git/main'
import { registerProjects } from '../slices/projects/main'
import { registerRuns } from '../slices/runs/main'
import { registerScopes, scopeNames, scopeSettings } from '../slices/scopes/main'
import { registerLayout } from './layout'

// Tests give each scenario its own user data dir so a relaunch restores that scenario's tabs.
if (process.env.DECISIONS_USER_DATA) app.setPath('userData', process.env.DECISIONS_USER_DATA)

let decisions: ReturnType<typeof registerDecisions>
let runs: ReturnType<typeof registerRuns>
let projectOf: (runId: string) => string | undefined = () => undefined

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
  )
  ipcMain.handle('agent:mcp-url', () => mcp.url)
  // Test hook: only exists when the harness picked a runtime by env.
  if (process.env.DECISIONS_RUNTIME) {
    ipcMain.handle('agent:use-runtime', (_e, kind: RuntimeKind) => setRuntime(kind))
    ipcMain.handle('agent:hide-claude', () => {
      process.env.PATH = ''
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
    () => runs.startRun('/grill-with-docs'),
    (path) => {
      runs.stopProject(path)
      files.stop(path)
    },
  )
  runs = registerRuns(win, projects.active, mcpUrl)
  projectOf = runs.projectOf
  decisions = registerDecisions(win, runs.projectOf, (project, scope) => {
    const s = scopeSettings(project).find((x) => x.name.toLowerCase() === scope.toLowerCase())
    return s ?? { mine: true } // an unknown Scope counts as In-Scope
  })
  registerScopes()
  registerLayout()
  // Terminal tools: links open in the browser, the clipboard is the system one.
  ipcMain.handle('shell:open', (_e, url: string) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
  })
  ipcMain.handle('clipboard:read', () => clipboard.readText())
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(text))
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null) // no File/Edit/View/Window bar
  registerGit()
  registerArchitecture(() =>
    runs.startRun('Curate the architecture: run `groma agent-instructions` and follow it'),
  )
  createWindow(await startMcp())
})
app.on('window-all-closed', () => app.quit())
