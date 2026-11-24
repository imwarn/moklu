/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, StudioLocaleProvider from @/i18n, useEditorStore from @/store, useAssetStore from @/store/assets, ProjectBackupBadge from ./ProjectBackupBadge, and backup helpers from ./projectBackupStorage
 * [OUTPUT]: Vitest suite verifying cumulative edit & slide-group backup thresholds, localStorage persistence, safe .moklu bundle export, and localized SSR rendering of ProjectBackupBadge
 * [POS]: automated unit test suite for src/components/toolbar/ProjectBackupBadge.tsx and projectBackupStorage.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { StudioLocaleProvider } from '@/i18n'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { isProjectExportBundle } from '@/utils/projectAssets'
import { ProjectBackupBadge } from './ProjectBackupBadge'
import {
  BACKUP_EDIT_THRESHOLD,
  BACKUP_STORAGE_KEY,
  buildSafeBackupFilename,
  exportProjectBackupFile,
  markProjectBackedUp,
  readBackupState,
  recordProjectEdit,
  shouldRecommendBackup,
} from './projectBackupStorage'

function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

describe('ProjectBackupBadge', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
    useAssetStore.getState().clearAssets()
    useEditorStore.getState().resetProject()
  })

  it('recommends backup after 15 cumulative edits or 3+ slide groups and resets after backup', () => {
    expect(shouldRecommendBackup(undefined, 1)).toBe(false)
    expect(shouldRecommendBackup(undefined, 2)).toBe(false)
    expect(shouldRecommendBackup(undefined, 3)).toBe(true)

    const id = 'proj-threshold'
    for (let i = 0; i < BACKUP_EDIT_THRESHOLD - 1; i += 1) {
      recordProjectEdit(id)
    }
    expect(shouldRecommendBackup(readBackupState()[id], 1)).toBe(false)

    recordProjectEdit(id)
    expect(readBackupState()[id].editCount).toBe(BACKUP_EDIT_THRESHOLD)
    expect(shouldRecommendBackup(readBackupState()[id], 1)).toBe(true)

    markProjectBackedUp(id, '2026-11-24T10:00:00.000Z')
    const afterBackup = readBackupState()[id]
    expect(afterBackup.lastBackedUpAt).toBe('2026-11-24T10:00:00.000Z')
    expect(afterBackup.backedUpAtEditCount).toBe(BACKUP_EDIT_THRESHOLD)
    // Backed up projects with 3+ groups do not nag until 15 more edits occur
    expect(shouldRecommendBackup(afterBackup, 4)).toBe(false)

    for (let i = 0; i < BACKUP_EDIT_THRESHOLD; i += 1) {
      recordProjectEdit(id)
    }
    expect(shouldRecommendBackup(readBackupState()[id], 4)).toBe(true)
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toContain(id)
  })

  it('sanitizes project names into portable .moklu filenames and builds a valid bundle', () => {
    expect(buildSafeBackupFilename('My Launch Deck v2!')).toBe('my-launch-deck-v2.moklu')
    expect(buildSafeBackupFilename('   ')).toBe('moklu-project.moklu')

    const project = useEditorStore.getState().project
    const { filename, json } = exportProjectBackupFile(project, () => undefined)
    expect(filename.endsWith('.moklu')).toBe(true)
    const parsed: unknown = JSON.parse(json)
    expect(isProjectExportBundle(parsed)).toBe(true)
    expect(readBackupState()[project.id]?.lastBackedUpAt).toBeTruthy()
  })

  it('renders localized reminder pill when threshold is met and hides when freshly backed up', () => {
    // React SSR reads Zustand getInitialState() via useSyncExternalStore's getServerSnapshot.
    const ssrProjectId = useEditorStore.getInitialState().project.id
    for (let i = 0; i < BACKUP_EDIT_THRESHOLD; i += 1) {
      recordProjectEdit(ssrProjectId)
    }

    const zhHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, { locale: 'zh', children: createElement(ProjectBackupBadge) }),
    )
    expect(zhHtml).toContain('data-testid="project-backup-badge"')
    expect(zhHtml).toContain('仅保存在当前浏览器 · 建议导出备份 (.moklu)')

    const enHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, { locale: 'en', children: createElement(ProjectBackupBadge) }),
    )
    expect(enHtml).toContain('Local only · Export backup (.moklu)')

    markProjectBackedUp(ssrProjectId)
    const hiddenHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, { locale: 'zh', children: createElement(ProjectBackupBadge) }),
    )
    expect(hiddenHtml).toBe('')
  })
})
