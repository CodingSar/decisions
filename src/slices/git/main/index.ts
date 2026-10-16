import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve as resolvePath, sep } from 'node:path'
import { ipcMain } from 'electron'
import type { GitChange, GitStatus } from '../model'

// Runs system `git` in the Project; stderr is the error shown to the human.
function git(project: string, ...args: string[]) {
  return new Promise<{ ok: boolean; out: string }>((resolve) =>
    execFile(
      'git',
      args,
      {
        cwd: project,
        maxBuffer: 64 << 20,
        timeout: 60_000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '', SSH_ASKPASS: '' },
      },
      (err, out, stderr) =>
        resolve({
          ok: !err,
          out: err ? stderr.trim() || out.trim() || err.message : out,
        }),
    ),
  )
}

async function status(project: string): Promise<GitStatus> {
  if (!existsSync(join(project, '.git')))
    return { repo: false, branch: '', branches: [], changes: [] }
  const [s, b, all] = await Promise.all([
    git(project, 'status', '--porcelain', '-z', '-uall'),
    git(project, 'symbolic-ref', '--short', 'HEAD'),
    git(project, 'for-each-ref', '--format=%(refname:short)', 'refs/heads'),
  ])
  // Detached HEAD: show the short sha instead of git's error.
  const branch = b.ok
    ? b.out.trim()
    : (await git(project, 'rev-parse', '--short', 'HEAD')).out.trim()
  const changes: GitChange[] = []
  const lines = s.out.split('\0').filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const [x, y, , ...name] = lines[i]
    // Renames/copies are followed by a second token holding the old path.
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') i++
    const path = name.join('')
    if (x !== ' ' && x !== '?') changes.push({ path, staged: true })
    if (y !== ' ' || x === '?') changes.push({ path, staged: false })
  }
  const branches = [...new Set([branch, ...all.out.split('\n').filter(Boolean)])]
  return { repo: true, branch, branches, changes }
}

export function registerGit() {
  ipcMain.handle('git:status', (_e, project: string) => status(project))
  // Both sides of a file's diff: HEAD (empty when new) against the working tree.
  ipcMain.handle('git:diff', async (_e, project: string, path: string) => {
    const root = resolvePath(project)
    const file = resolvePath(root, path)
    if (file === root || !file.startsWith(root + sep)) return { original: '', modified: '' }
    const head = await git(project, 'show', `HEAD:${path}`)
    let modified = ''
    try {
      modified = readFileSync(file, 'utf8')
    } catch {
      // Missing (deleted), a directory or unreadable: show an empty side.
    }
    return { original: head.ok ? head.out : '', modified }
  })
  ipcMain.handle('git:stage', (_e, project: string, path: string) =>
    git(project, 'add', '--', path),
  )
  ipcMain.handle('git:unstage', (_e, project: string, path: string) =>
    git(project, 'reset', '-q', '--', path),
  )
  ipcMain.handle('git:push', (_e, project: string) => git(project, 'push'))
  ipcMain.handle('git:pull', (_e, project: string) => git(project, 'pull', '--ff-only'))
  ipcMain.handle('git:checkout', async (_e, project: string, branch: string) => {
    if (!(await status(project)).branches.includes(branch))
      return { ok: false, out: `Unknown branch: ${branch}` }
    return git(project, 'switch', '--end-of-options', branch)
  })
  ipcMain.handle('git:init', (_e, project: string) => git(project, 'init', '-b', 'main'))
  ipcMain.handle('git:commit', (_e, project: string, message: string) =>
    git(project, 'commit', '-m', message),
  )
}
