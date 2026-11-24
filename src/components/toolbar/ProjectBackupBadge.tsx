/**
 * [INPUT]: depends on react, zustand useShallow, useEditorStore from @/store, useAssetStore from @/store/assets, DownloadIcon from @/components/ui/StudioIcons, useStudioLocale from @/i18n, and backup storage helpers from ./projectBackupStorage
 * [OUTPUT]: exports ProjectBackupBadge non-intrusive Toolbar pill component recommending one-click .moklu backup downloads
 * [POS]: local-only storage reminder pill inside src/components/toolbar; subscribes to project edits and triggers portable .moklu backup exports
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { DownloadIcon } from '@/components/ui/StudioIcons'
import { useStudioLocale } from '@/i18n'
import {
  BACKUP_UPDATED_EVENT,
  exportProjectBackupFile,
  readBackupState,
  recordProjectEdit,
  shouldRecommendBackup,
} from './projectBackupStorage'

export function ProjectBackupBadge() {
  const { t } = useStudioLocale()
  const { project } = useEditorStore(useShallow((s) => ({ project: s.project })))
  const [, setRevision] = useState(0)

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.project.id !== prev.project.id) {
        setRevision((n) => n + 1)
        return
      }
      if (state.project !== prev.project) {
        recordProjectEdit(state.project.id)
        setRevision((n) => n + 1)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleBackedUp = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail
      if (!detail?.projectId || detail.projectId === project.id) {
        setRevision((n) => n + 1)
      }
    }
    window.addEventListener(BACKUP_UPDATED_EVENT, handleBackedUp)
    return () => window.removeEventListener(BACKUP_UPDATED_EVENT, handleBackedUp)
  }, [project.id])

  const record = readBackupState()[project.id]
  const recommended = shouldRecommendBackup(record, project.slideGroups.length)
  if (!recommended) return null

  const handleBackupClick = () => {
    const resolveAsset = (key: string) => useAssetStore.getState().getAsset(key)
    exportProjectBackupFile(project, resolveAsset)
    setRevision((n) => n + 1)
  }

  return (
    <button
      type="button"
      data-testid="project-backup-badge"
      onClick={handleBackupClick}
      title={t.toolbar.backupReminderTitle}
      aria-label={t.toolbar.backupReminderTitle}
      className="hidden max-w-[250px] shrink-0 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/20 hover:text-amber-100 min-[1180px]:inline-flex"
    >
      <DownloadIcon size={12} />
      <span className="truncate">{t.toolbar.backupReminderLabel}</span>
    </button>
  )
}
