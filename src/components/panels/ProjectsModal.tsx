/**
 * [INPUT]: depends on react, useProjectsStore, useEditorStore, ConfirmDialog, ModalShell, InlineEditableLabel, FileUploadButton, ProjectConflictError, checkImportFileSize, and useStudioLocale/formatMessage/formatRelativeTime from @/i18n
 * [OUTPUT]: exports ProjectsModal local project manager dialog localized across EN/ZH/JA/KO with Intl.RelativeTimeFormat timestamps
 * [POS]: project switcher/backup dialog launched from Studio Toolbar inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useEffect, useRef } from 'react'
import { notifyProjectConflict, useProjectsStore } from '@/store/projects'
import { useEditorStore } from '@/store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ModalShell } from '@/components/ui/ModalShell'
import { InlineEditableLabel } from '@/components/ui/InlineEditableLabel'
import { FileUploadButton } from '@/components/ui/FileUploadButton'
import { ProjectConflictError } from '@/store/storage/types'
import { checkImportFileSize } from '@/utils/importValidation'
import { formatMessage, formatRelativeTime, useStudioLocale } from '@/i18n'


interface ProjectsModalProps {
  open: boolean
  onClose: () => void
}

export function ProjectsModal({ open, onClose }: ProjectsModalProps) {
  const { uiLocale, t } = useStudioLocale()
  const pm = t.modals.projects
  const { projects, createProject, openProject, deleteProject, renameProject } =
    useProjectsStore()
  const activeProjectId = useEditorStore((s) => s.project.id)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNameError, setNewNameError] = useState('')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const newNameInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Focus new name input when creating
  useEffect(() => {
    if (creatingNew) newNameInputRef.current?.focus()
  }, [creatingNew])

  const startRename = (id: string) => {
    setRenamingId(id)
  }

  const handleOpen = async (id: string) => {
    if (id === activeProjectId) {
      onClose()
      return
    }
    setOpeningId(id)
    try {
      await openProject(id)
      onClose()
    } catch (err) {
      if (err instanceof ProjectConflictError) notifyProjectConflict(err.projectId)
      else console.error('[Moklu] Failed to open project', err)
    } finally {
      setOpeningId(null)
    }
  }

  const handleNew = () => {
    setCreatingNew(true)
    setNewName('')
    setNewNameError('')
  }

  const handleCreateConfirm = async () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setNewNameError(pm.nameRequired)
      return
    }
    setCreatingBusy(true)
    try {
      await createProject(trimmed)
      setCreatingNew(false)
      onClose()
    } catch (err) {
      if (err instanceof ProjectConflictError) {
        notifyProjectConflict(err.projectId)
        setNewNameError(pm.conflictCreateError)
      } else {
        setNewNameError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setCreatingBusy(false)
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeletingBusy(true)
    try {
      await deleteProject(deleteId)
      if (deleteId === activeProjectId) onClose()
      setDeleteId(null)
    } catch (err) {
      if (err instanceof ProjectConflictError) notifyProjectConflict(err.projectId)
      else console.error('[Moklu] Failed to delete project', err)
    } finally {
      setDeletingBusy(false)
    }
  }

  const handleExportProject = async (id: string, name: string) => {
    try {
      const json = await useProjectsStore.getState().exportProjectBundle(id)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const slug = name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase() || 'project'
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}.json`
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Moklu] Failed to export project', err)
      alert(pm.exportFailedAlert)
    }
  }

  const handleImport = () => importInputRef.current?.click()

  const handleImportFile = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      checkImportFileSize(file.size)
      const json = await file.text()
      const { missing } = await useProjectsStore.getState().importProjectFromJson(json)
      onClose()
      if (missing.length > 0) {
        alert(formatMessage(pm.importMissingImagesAlert, { count: missing.length }))
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : pm.importOpenFailedAlert)
    }
  }

  // Sort: active first, then by most recently updated
  const sorted = [...projects].sort((a, b) => {
    if (a.id === activeProjectId) return -1
    if (b.id === activeProjectId) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <>
      <ConfirmDialog
        open={deleteId !== null}
        title={`${pm.deleteTitle}: "${projects.find((p) => p.id === deleteId)?.name ?? ''}"`}
        message={pm.deleteConfirmMsg}
        confirmLabel={pm.deleteConfirmBtn}
        danger
        busy={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ModalShell
        open={open}
        onClose={onClose}
        onEscape={() => {
          if (deleteId) return
          if (creatingNew) setCreatingNew(false)
          else onClose()
        }}
        maxWidth="max-w-lg"
        backdropClassName="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
        panelStyle={{ background: '#18181f', borderColor: 'rgba(255,255,255,0.1)', maxHeight: '75vh', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        showCloseButton={false}
        header={<div
            style={{
              padding: '18px 20px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e8e8f0' }}>
              {pm.title}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={handleImport}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#a0a0b0',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '5px 12px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#a0a0b0'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                {t.common.import}
              </button>
              <button
                onClick={handleNew}
                style={{
                  background: 'var(--color-accent-strong)',
                  color: 'var(--color-accent-fg)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {pm.newProject}
              </button>
              <FileUploadButton
                ref={importInputRef}
                accept=".json"
                onFiles={handleImportFile}
                className="hidden"
              >{t.common.import}</FileUploadButton>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b6b7a',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: '2px 4px',
                }}
              >
                ×
              </button>
            </div>
          </div>}
        footerClassName=""
        footer={<div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#6b6b7a', textAlign: 'center' }}>{pm.footerHint}</div>}
      >

          {/* New project form */}
          {creatingNew && (
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={newNameInputRef}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    if (newNameError) setNewNameError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateConfirm()
                    if (e.key === 'Escape') setCreatingNew(false)
                    e.stopPropagation()
                  }}
                  placeholder={pm.namePlaceholder}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${newNameError ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 6,
                    color: '#e8e8f0',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 10px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim() || creatingBusy}
                  style={{
                    background: newName.trim() && !creatingBusy ? 'var(--color-accent-strong)' : 'color-mix(in srgb, var(--color-accent-strong) 40%, transparent)',
                    color: 'var(--color-accent-fg)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: newName.trim() && !creatingBusy ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                  }}
                >
                  {creatingBusy ? pm.creating : pm.create}
                </button>
                <button
                  onClick={() => setCreatingNew(false)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#6b6b7a',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {t.common.cancel}
                </button>
              </div>
              {newNameError && (
                <div style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>
                  {newNameError}
                </div>
              )}
            </div>
          )}

          {/* Project list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 8px' }}>
            {sorted.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b6b7a', fontSize: 13, padding: '24px 0' }}>
                {pm.noProjects}
              </p>
            )}

            {sorted.map((p) => {
              const isActive = p.id === activeProjectId
              const isRenaming = renamingId === p.id

              return (
                <div
                  key={p.id}
                  onClick={() => !isRenaming && !openingId && void handleOpen(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                    border: isActive
                      ? '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)'
                      : '1px solid transparent',
                    marginBottom: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background =
                        'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)'
                        : 'rgba(255,255,255,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    📸
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <InlineEditableLabel
                        value={p.name}
                        editing={isRenaming}
                        onEditingChange={(editing) => {
                          setRenamingId(editing ? p.id : null)
                        }}
                        onCommit={(name) => {
                          renameProject(p.id, name).catch((err) => {
                            if (err instanceof ProjectConflictError) notifyProjectConflict(err.projectId)
                            else console.error('[Moklu] Rename failed', err)
                          })
                        }}
                        inputStyle={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid color-mix(in srgb, var(--color-accent) 60%, transparent)',
                          borderRadius: 4,
                          color: '#e8e8f0',
                          fontSize: 13,
                          fontWeight: 500,
                          padding: '2px 6px',
                          width: '100%',
                          outline: 'none',
                        }}
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: isActive ? 'var(--color-accent-text)' : '#e8e8f0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        className="block"
                      >
                        {isActive && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              background: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                              color: 'var(--color-accent-text)',
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontWeight: 600,
                            }}
                          >
                            {pm.current}
                          </span>
                        )}
                      </InlineEditableLabel>
                    <div style={{ fontSize: 11, color: '#6b6b7a', marginTop: 2 }}>
                      {formatRelativeTime(p.updatedAt, uiLocale, pm.justNow)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', gap: 4 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      title={pm.exportJsonTitle}
                      onClick={(e) => { e.stopPropagation(); void handleExportProject(p.id, p.name) }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b6b7a',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '4px',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#6b6b7a')
                      }
                    >
                      {t.common.export}
                    </button>
                    <button
                      title={pm.renameTitle}
                      onClick={(e) => {
                        e.stopPropagation()
                        startRename(p.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b6b7a',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '4px',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#6b6b7a')
                      }
                    >
                      ✎
                    </button>
                    <button
                      title={pm.deleteTitle}
                      onClick={(e) => handleDelete(e, p.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b6b7a',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '4px',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#f87171')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = '#6b6b7a')
                      }
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

      </ModalShell>
    </>
  )
}
