// A node of the Project file tree; `path` is relative to the Project folder.
export interface FileNode {
  name: string
  path: string
  children?: FileNode[]
}
