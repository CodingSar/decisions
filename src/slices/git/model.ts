// One changed path in `git status`; `staged` is true when it sits in the index.
export interface GitChange {
  path: string
  staged: boolean
}

export interface GitStatus {
  repo: boolean
  branch: string
  branches: string[]
  changes: GitChange[]
}
