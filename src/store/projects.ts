/** Project library state and async persistence. */

import { create } from 'zustand'
import type { Project } from '@/types'
import {
  buildProjectExportBundle,
  collectAssetKeys,
} from '@/utils/projectAssets'
import { useEditorStore } from './index'
import { migrateProject, newId, stripDataUrls } from './helpers'
import { parseBoundedImportJson, validateProjectImport } from '@/utils/importValidation'
import { useAssetStore } from './assets'
import { idbStorage } from './idb-storage'
import { isCaptureLocked } from '@/utils/stageCapture'
import { getProjectStorage } from './storage'
import { ProjectConflictError, type ProjectMeta } from './storage/types'

export type { ProjectMeta } from './storage/types'

const thumbnailKey = (id: string) => `pixeldeck-thumbs:${id}`
let storageWarningShown = false
const conflictedProjectIds = new Set<string>()
let saveChain: Promise<void> = Promise.resolve()
let bootstrapAbandoned = false
let pagehideListenerRegistered = false

function warnStorageFailure(err: unknown): void {
  console.warn('[PixelDeck] Project library save failed', err)
  if (storageWarningShown || typeof window === 'undefined') return
  storageWarningShown = true
  window.setTimeout(() => {
    alert('Project library save failed. Export Project now to avoid losing recent changes.')
  }, 0)
}

function handleProjectSaveConflict(id: string): void {
  if (conflictedProjectIds.has(id)) return
  conflictedProjectIds.add(id)
  useProjectsStore.setState({ conflictNotice: { projectId: id } })
}

export function notifyProjectConflict(id: string): void {
  handleProjectSaveConflict(id)
}

export function abandonBootstrap(): void {
  bootstrapAbandoned = true
}

async function loadProjectById(id: string, opts?: { checkAbandonment?: boolean }): Promise<boolean> {
  const json = await getProjectStorage().loadProject(id)
  // Only bootstrap reads are disposable; later user-initiated project switches must load normally.
  if (opts?.checkAbandonment && bootstrapAbandoned) return false
  if (!json) return false
  try {
    useEditorStore.getState().importProject(json)
  } catch (err) {
    console.warn('[PixelDeck] Failed to load project', err)
    return false
  }
  await getProjectStorage().setActiveProjectId(id)
  conflictedProjectIds.delete(id)
  return true
}

function projectPersistencePayload(): { meta: ProjectMeta; json: string } {
  registerPagehideFlush()
  const { project } = useEditorStore.getState()
  const meta: ProjectMeta = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
  return { meta, json: JSON.stringify(stripDataUrls(project)) }
}

async function persistCurrentProject({ meta, json }: { meta: ProjectMeta; json: string }): Promise<void> {
  try {
    await getProjectStorage().saveProject(meta, json)
    const { projects } = useProjectsStore.getState()
    const exists = projects.some((item) => item.id === meta.id)
    useProjectsStore.setState({
      projects: exists
        ? projects.map((item) => item.id === meta.id ? meta : item)
        : [...projects, meta],
    })
  } catch (err) {
    if (err instanceof ProjectConflictError) handleProjectSaveConflict(meta.id)
    else warnStorageFailure(err)
    throw err
  }
}

async function enqueueCurrentProjectSave(): Promise<void> {
  const payload = projectPersistencePayload()
  const task = saveChain.then(() => persistCurrentProject(payload))
  saveChain = task.catch(() => {})
  return task
}

async function persistRename(id: string, name: string): Promise<void> {
  try {
    await getProjectStorage().renameProject(id, name)
    const updated = await getProjectStorage().listProjects()
    useProjectsStore.setState({ projects: updated })
    if (useEditorStore.getState().project.id === id) useEditorStore.getState().setProjectName(name)
  } catch (err) {
    warnStorageFailure(err)
    throw err
  }
}

async function enqueueRename(id: string, name: string): Promise<void> {
  const task = saveChain.then(() => persistRename(id, name))
  saveChain = task.catch(() => {})
  return task
}

interface ProjectsStore {
  projects: ProjectMeta[]
  initialized: boolean
  conflictNotice: { projectId: string } | null
  initialize: () => Promise<void>
  saveCurrentProject: () => Promise<void>
  createProject: (name: string) => Promise<void>
  openProject: (id: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  dismissConflictAndReload: () => void
  saveConflictedProjectAsCopy: () => Promise<void>
  exportProjectBundle: (id: string) => Promise<string>
  importProjectFromJson: (json: string) => Promise<{ missing: string[] }>
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  initialized: false,
  conflictNotice: null,

  async initialize() {
    try {
      const projects = await getProjectStorage().listProjects()
      const activeId = await getProjectStorage().getActiveProjectId()
      let loaded = false
      if (activeId && projects.some((project) => project.id === activeId)) {
        loaded = await loadProjectById(activeId, { checkAbandonment: true })
      }
      if (!loaded && projects.length > 0) {
        loaded = await loadProjectById(projects[0].id, { checkAbandonment: true })
      }

      set({ projects })
      await useAssetStore.getState().setActiveProject(useEditorStore.getState().project.id)
      // With no stored projects, persisting the current default is still correct even after an abandoned read.
      if (projects.length === 0) await get().saveCurrentProject()
      // This also writes the pointer when no project was loaded (empty or unreadable library paths).
      await getProjectStorage().setActiveProjectId(useEditorStore.getState().project.id)
    } catch (err) {
      console.warn('[PixelDeck] Project library initialization failed', err)
    } finally {
      set({ initialized: true })
    }
  },

  saveCurrentProject() {
    return enqueueCurrentProjectSave()
  },

  async createProject(name) {
    const trimmed = name.trim()
    const { projects } = get()
    const duplicate = projects.find((project) => project.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) throw new Error(`A project named "${trimmed}" already exists.`)

    await get().saveCurrentProject()
    useEditorStore.getState().resetProject()
    useEditorStore.getState().setProjectName(trimmed)
    await getProjectStorage().setActiveProjectId(useEditorStore.getState().project.id)
    await useAssetStore.getState().setActiveProject(useEditorStore.getState().project.id)
    await get().saveCurrentProject()
  },

  async openProject(id) {
    if (!get().projects.some((project) => project.id === id)) return
    await get().saveCurrentProject()
    if (!await loadProjectById(id)) return
    await useAssetStore.getState().setActiveProject(useEditorStore.getState().project.id)
  },

  async deleteProject(id) {
    await get().saveCurrentProject()
    await getProjectStorage().deleteProject(id)
    await useAssetStore.getState().clearProject(id)
    await idbStorage.removeItem(thumbnailKey(id))

    const updated = get().projects.filter((project) => project.id !== id)
    set({ projects: updated })

    if (useEditorStore.getState().project.id !== id) return
    const replacement = updated[0]
    if (!replacement || !await loadProjectById(replacement.id)) {
      useEditorStore.getState().resetProject()
      await getProjectStorage().setActiveProjectId(useEditorStore.getState().project.id)
      await get().saveCurrentProject()
    }
    await useAssetStore.getState().setActiveProject(useEditorStore.getState().project.id)
  },

  renameProject(id, name) {
    return enqueueRename(id, name)
  },

  // Retained for a future explicit Reload button; conflict dismissal must not call this implicitly.
  dismissConflictAndReload() {
    if (typeof window !== 'undefined') window.location.reload()
  },

  async saveConflictedProjectAsCopy() {
    const oldProjectId = useEditorStore.getState().project.id
    if (oldProjectId !== get().conflictNotice?.projectId) {
      set({ conflictNotice: null })
      return
    }
    const project = useEditorStore.getState().project
    const originalProjectJson = JSON.stringify(project)
    const newProjectId = newId()
    try {
      const storedAssets = await useAssetStore.getState().loadProjectAssets(oldProjectId)
      const copiedAssets = Object.fromEntries(
        Object.entries(storedAssets).map(([key, asset]) => [key, asset.dataUrl]),
      )
      useEditorStore.getState().importProject(JSON.stringify({
        ...project,
        id: newProjectId,
        name: `${project.name} (copy)`,
      }))
      await useAssetStore.getState().setActiveProject(newProjectId)
      await useAssetStore.getState().hydrateProject(newProjectId, copiedAssets)
      await get().saveCurrentProject()
      await getProjectStorage().setActiveProjectId(newProjectId)
      conflictedProjectIds.delete(oldProjectId)
      set({ conflictNotice: null })
    } catch (err) {
      // Restore the conflicted working copy so the notice remains retryable after any copy failure.
      useEditorStore.getState().importProject(originalProjectJson)
      try {
        await useAssetStore.getState().setActiveProject(oldProjectId)
      } catch (restoreErr) {
        console.error('[PixelDeck] Failed to restore conflicted project assets', restoreErr)
      }
      console.error('[PixelDeck] Failed to save conflicted project as a copy', err)
      if (typeof window !== 'undefined') alert('Could not save a copy of this project. Please try again.')
    }
  },

  async exportProjectBundle(id) {
    const editor = useEditorStore.getState()
    const assetStore = useAssetStore.getState()
    let project: Project
    let resolve: (key: string) => string | undefined
    if (editor.project.id === id) {
      project = editor.project
      resolve = (key) => assetStore.getAsset(key)
    } else {
      const json = await getProjectStorage().loadProject(id)
      if (!json) throw new Error('Project not found')
      project = JSON.parse(json) as Project
      const stored = await assetStore.loadProjectAssets(id)
      resolve = (key) => stored[key]?.dataUrl
    }
    const { bundle } = buildProjectExportBundle(project, resolve)
    return JSON.stringify(bundle, null, 2)
  },

  async importProjectFromJson(json) {
    // Validate and migrate before touching any editor state, active pointers or
    // the existing project. A malformed import is a complete no-op.
    const { project: rawProject, assets } = validateProjectImport(parseBoundedImportJson(json))
    const nextProject = migrateProject({ ...rawProject, id: newId() })
    const oldProject = useEditorStore.getState().project
    const oldAssetScope = useAssetStore.getState().activeProjectId
    const storage = getProjectStorage()
    const newProjectId = nextProject.id
    const meta: ProjectMeta = {
      id: newProjectId,
      name: nextProject.name,
      createdAt: nextProject.createdAt,
      updatedAt: nextProject.updatedAt,
    }
    let changedEditor = false

    // Save the original first. Stage project data and image assets in a fresh
    // namespace before switching the visible editor. No overwrite of old IDs.
    await get().saveCurrentProject()
    try {
      await storage.saveProject(meta, JSON.stringify(stripDataUrls(nextProject)))
      await useAssetStore.getState().hydrateProject(newProjectId, assets)
      // idbStorage intentionally swallows some write errors for normal autosave.
      // Verify imported image bytes were actually persisted before switching.
      if (Object.keys(assets).length > 0 && typeof indexedDB !== 'undefined') {
        const staged = await useAssetStore.getState().loadProjectAssets(newProjectId)
        const complete = Object.entries(assets).every(([key, dataUrl]) =>
          staged[key]?.dataUrl === dataUrl)
        if (!complete) throw new Error('Unable to persist imported images. The original project is unchanged.')
      }
      useEditorStore.getState().importProject(JSON.stringify(nextProject))
      changedEditor = true
      await storage.setActiveProjectId(newProjectId)
      await get().saveCurrentProject()
      const referenced = collectAssetKeys(useEditorStore.getState().project)
      return { missing: [...referenced].filter((key) => !(key in assets)) }
    } catch (error) {
      // Best-effort compensation if an adapter/IndexedDB write fails. Never
      // leave a failed import selected, and do not delete the previous project.
      if (changedEditor) {
        try { useEditorStore.getState().importProject(JSON.stringify(oldProject)) }
        catch (restoreError) { console.error('[Moklu] Failed to restore editor after import', restoreError) }
      }
      try { await storage.setActiveProjectId(oldProject.id) }
      catch (restoreError) { console.error('[Moklu] Failed to restore active project pointer', restoreError) }
      try {
        await useAssetStore.getState().clearProject(newProjectId)
        await useAssetStore.getState().setActiveProject(oldAssetScope ?? oldProject.id)
      } catch (restoreError) {
        console.error('[Moklu] Failed to restore active project assets', restoreError)
      }
      try { await storage.deleteProject(newProjectId) }
      catch (restoreError) { console.error('[Moklu] Failed to clear staged import', restoreError) }
      throw error
    }
  },
}))

export async function bootstrapProjects(): Promise<void> {
  await useProjectsStore.getState().initialize()
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave(delayMs: number): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (isCaptureLocked()) {
      scheduleAutoSave(250)
      return
    }
    if (conflictedProjectIds.has(useEditorStore.getState().project.id)) return
    void useProjectsStore.getState().saveCurrentProject().catch(() => {})
  }, delayMs)
}

useEditorStore.subscribe((state, previous) => {
  if (!useProjectsStore.getState().initialized || state.project === previous.project) return
  scheduleAutoSave(1500)
})

function registerPagehideFlush(): void {
  if (pagehideListenerRegistered || typeof window === 'undefined') return
  pagehideListenerRegistered = true
  window.addEventListener('pagehide', () => {
    if (!useProjectsStore.getState().initialized || isCaptureLocked()) return
    const payload = projectPersistencePayload()
    if (conflictedProjectIds.has(payload.meta.id)) return
    // This is only reliable for the synchronous local adapter; a network adapter needs sendBeacon support.
    void getProjectStorage().saveProject(payload.meta, payload.json).catch(() => {})
  })
}

registerPagehideFlush()
