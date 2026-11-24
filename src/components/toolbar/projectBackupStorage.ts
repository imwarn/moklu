/**
 * [INPUT]: depends on Project from @/types and buildProjectExportBundle from @/utils/projectAssets
 * [OUTPUT]: exports BACKUP_STORAGE_KEY, BACKUP_EDIT_THRESHOLD, BACKUP_SLIDE_GROUP_THRESHOLD, BACKUP_UPDATED_EVENT, ProjectBackupRecord, BackupStateMap, readBackupState, recordProjectEdit, markProjectBackedUp, shouldRecommendBackup, buildSafeBackupFilename, and exportProjectBackupFile
 * [POS]: pure localStorage edit-counter and .moklu portable backup helper module paired with ProjectBackupBadge inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Project } from '@/types'
import { buildProjectExportBundle } from '@/utils/projectAssets'

export const BACKUP_STORAGE_KEY = 'moklu-backup-state'
export const BACKUP_EDIT_THRESHOLD = 15
export const BACKUP_SLIDE_GROUP_THRESHOLD = 3
export const BACKUP_UPDATED_EVENT = 'moklu:project-backed-up'

export interface ProjectBackupRecord {
  editCount: number
  lastBackedUpAt?: string
  backedUpAtEditCount?: number
}

export type BackupStateMap = Record<string, ProjectBackupRecord>

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function readBackupState(): BackupStateMap {
  const storage = getStorage()
  if (!storage) return {}
  try {
    const raw = storage.getItem(BACKUP_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: BackupStateMap = {}
    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue
      const rec = entry as Record<string, unknown>
      const editCount = typeof rec.editCount === 'number' && Number.isFinite(rec.editCount) && rec.editCount >= 0
        ? Math.floor(rec.editCount)
        : 0
      const backedUpAtEditCount = typeof rec.backedUpAtEditCount === 'number' && Number.isFinite(rec.backedUpAtEditCount)
        ? Math.floor(rec.backedUpAtEditCount)
        : undefined
      const lastBackedUpAt = typeof rec.lastBackedUpAt === 'string' && rec.lastBackedUpAt.length > 0
        ? rec.lastBackedUpAt
        : undefined
      out[id] = { editCount, lastBackedUpAt, backedUpAtEditCount }
    }
    return out
  } catch {
    return {}
  }
}

function writeBackupState(map: BackupStateMap): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function recordProjectEdit(projectId: string): ProjectBackupRecord {
  const state = readBackupState()
  const existing = state[projectId] ?? { editCount: 0 }
  const next: ProjectBackupRecord = {
    ...existing,
    editCount: existing.editCount + 1,
  }
  state[projectId] = next
  writeBackupState(state)
  return next
}

export function markProjectBackedUp(projectId: string, nowIso = new Date().toISOString()): ProjectBackupRecord {
  const state = readBackupState()
  const existing = state[projectId] ?? { editCount: 0 }
  const next: ProjectBackupRecord = {
    editCount: existing.editCount,
    lastBackedUpAt: nowIso,
    backedUpAtEditCount: existing.editCount,
  }
  state[projectId] = next
  writeBackupState(state)
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(BACKUP_UPDATED_EVENT, { detail: { projectId } }))
  }
  return next
}

export function shouldRecommendBackup(
  record: ProjectBackupRecord | undefined,
  slideGroupCount: number,
): boolean {
  const editCount = record?.editCount ?? 0
  const backedUpAtEditCount = record?.backedUpAtEditCount ?? 0
  const editsSinceBackup = Math.max(0, editCount - backedUpAtEditCount)
  if (editsSinceBackup >= BACKUP_EDIT_THRESHOLD) return true
  if (!record?.lastBackedUpAt && slideGroupCount >= BACKUP_SLIDE_GROUP_THRESHOLD) return true
  return false
}

export function buildSafeBackupFilename(projectName: string): string {
  const slug = projectName
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${slug || 'moklu-project'}.moklu`
}

export function exportProjectBackupFile(
  project: Project,
  resolveAsset: (key: string) => string | undefined,
): { filename: string; json: string } {
  const { bundle } = buildProjectExportBundle(project, resolveAsset)
  const json = JSON.stringify(bundle, null, 2)
  const filename = buildSafeBackupFilename(project.name || 'moklu-project')

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  markProjectBackedUp(project.id)
  return { filename, json }
}
