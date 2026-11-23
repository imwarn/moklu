/**
 * [INPUT]: depends on no internal modules (pure TypeScript contract and Error subclass)
 * [OUTPUT]: exports ProjectMeta interface, ProjectStorageAdapter async persistence interface, and ProjectConflictError class
 * [POS]: dependency-inversion storage contract in src/store/storage/; implemented by localStorageAdapter and optional commercial/cloud host adapters
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export interface ProjectMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ProjectStorageAdapter {
  listProjects(): Promise<ProjectMeta[]>
  loadProject(id: string): Promise<string | null>
  saveProject(meta: ProjectMeta, json: string): Promise<void>
  deleteProject(id: string): Promise<void>
  renameProject(id: string, name: string): Promise<void>
  getActiveProjectId(): Promise<string | null>
  setActiveProjectId(id: string | null): Promise<void>
}

export class ProjectConflictError extends Error {
  readonly projectId: string

  constructor(projectId: string, message = `Project "${projectId}" was modified elsewhere and could not be saved.`) {
    super(message)
    this.name = 'ProjectConflictError'
    this.projectId = projectId
  }
}
