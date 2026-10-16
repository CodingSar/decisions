import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Decision, parse, serialize } from '../model'

const dirOf = (project: string) => join(project, '.decisions')
const fileOf = (project: string, id: number) => join(dirOf(project), `D${id}.md`)
const idOf = (name: string) => /^D(\d+)\.md$/.exec(name)?.[1]

export function readAll(project: string): Decision[] {
  let names: string[] = []
  try {
    names = readdirSync(dirOf(project))
  } catch {}
  return names
    .flatMap((n) => {
      const id = idOf(n)
      return id ? [Number(id)] : []
    })
    .sort((a, b) => a - b)
    .map((id) => parse(id, readFileSync(fileOf(project, id), 'utf8')))
}

export function write(project: string, d: Decision) {
  mkdirSync(dirOf(project), { recursive: true })
  writeFileSync(fileOf(project, d.id), serialize(d))
}

// Sync on purpose: allocating the ID and writing the file must not interleave.
export function create(project: string, d: Omit<Decision, 'id'>): Decision {
  const id = Math.max(0, ...readAll(project).map((x) => x.id)) + 1
  const decision = { ...d, id }
  write(project, decision)
  return decision
}

export const remove = (project: string, id: number) => rmSync(fileOf(project, id), { force: true })
