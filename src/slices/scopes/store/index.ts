import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ScopeSetting, withSeeded } from '../model'

// ADR 0003: Scope settings live in the Project's `.decisions/config.json`.
const fileOf = (project: string) => join(project, '.decisions', 'config.json')

export function readScopes(project: string): ScopeSetting[] {
  let stored: ScopeSetting[] = []
  try {
    stored = JSON.parse(readFileSync(fileOf(project), 'utf8')).scopes ?? []
  } catch {}
  return withSeeded(stored)
}

export function writeScopes(project: string, scopes: ScopeSetting[]) {
  mkdirSync(join(project, '.decisions'), { recursive: true })
  writeFileSync(fileOf(project), JSON.stringify({ scopes }, null, 2))
}
