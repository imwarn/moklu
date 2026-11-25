/**
 * [INPUT]: depends on useEditorStore from @/store; multiFormatExport, exportZip, canvasFormats, and panoGeometry utils; ModalShell/NumberInput/ToggleSwitch; useStudioLocale from @/i18n
 * [OUTPUT]: exports ExportModal component for batch multi-format/multi-locale PNG, ZIP, and directory exports
 * [POS]: export dialog within src/components/panels, mounted by StudioPage and opened from SlideNavigator
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import type Konva from 'konva'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store'
import { countFormatAdjustments, getCanvasFormat, getExportTargets, getFormatCanvasDims, getFormatLabel, getProjectBaseFormat, groupTargetsFormat } from '@/utils/canvasFormats'
import { ExportCancelledError, exportProjectImages, type ProjectExportScope, type ProjectImageExportResult } from '@/utils/multiFormatExport'
import { DEFAULT_PANO_COMPENSATION_PX, MAX_PANO_COMPENSATION_PX, normalizePanoCompensationPx } from '@/utils/panoGeometry'
import { downloadDataUrl } from '@/utils/export'
import { buildExportZipBlob, writeExportDirectoryFile, zipFileNameFor } from '@/utils/exportZip'
import { waitForStage } from '@/utils/stageCapture'
import type { CanvasFormatId } from '@/types'
import { ModalShell } from '@/components/ui/ModalShell'
import { NumberInput } from '@/components/ui/NumberInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useStudioLocale } from '@/i18n'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  stageRef: React.RefObject<Konva.Stage | null>
}

type ExportOutput = 'zip' | 'folder' | 'downloads'

export function ExportModal({ open, onClose, stageRef }: ExportModalProps) {
  const { t } = useStudioLocale()
  const em = t.modals.export
  const {
    project,
    activeSlideGroupId,
    activeCanvasFormat,
    panoSettings,
  } = useEditorStore(useShallow((s) => ({
    project: s.project,
    activeSlideGroupId: s.activeSlideGroupId,
    activeCanvasFormat: s.activeCanvasFormat,
    panoSettings: s.project.settings.pano ?? { gapPx: 24, compensate: false },
  })))

  const [exportScope, setExportScope] = useState<ProjectExportScope>('project')
  const [selectedExportFormats, setSelectedExportFormats] = useState<CanvasFormatId[]>([])
  const [selectedExportLocales, setSelectedExportLocales] = useState<string[]>([])
  const panoMode = 'split' as const
  const [compensatePanoExport, setCompensatePanoExport] = useState(true)
  const [panoCompensationInput, setPanoCompensationInput] = useState(String(DEFAULT_PANO_COMPENSATION_PX))
  const [exportOutput, setExportOutput] = useState<ExportOutput>('zip')
  const [isExporting, setIsExporting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [exportProgress, setExportProgress] = useState<{
    completed: number
    total: number
    formatLabel: string
    locale: string
    groupName: string
    phase: 'rendering' | 'restoring' | 'zipping' | 'writing' | 'downloading'
  } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [stageReady, setStageReady] = useState(false)

  // Derived values
  const rawActiveGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)
  const baseFormat = getProjectBaseFormat(project)
  const activeGroup = useMemo(() => rawActiveGroup && ({
    ...rawActiveGroup,
    ...getFormatCanvasDims(rawActiveGroup, activeCanvasFormat, baseFormat, project.settings.customFormats),
  }), [rawActiveGroup, activeCanvasFormat, baseFormat, project.settings.customFormats])
  const exportableFormats = getExportTargets(project)
  const projectLocales = Array.from(new Set(project.settings.locales?.length
    ? project.settings.locales
    : [project.settings.defaultLocale ?? 'en']))
  const folderSupported = Boolean(typeof window !== 'undefined' && window.showDirectoryPicker)
  const canRunExport = stageReady && !isExporting && selectedExportFormats.length > 0 && selectedExportLocales.length > 0 && (exportOutput !== 'folder' || folderSupported)
  const selectedGroupCount = exportScope === 'current-group' ? 1 : project.slideGroups.length
  const exportSummary = `${selectedGroupCount} group${selectedGroupCount === 1 ? '' : 's'} · ${selectedExportFormats.length} format${selectedExportFormats.length === 1 ? '' : 's'} · ${selectedExportLocales.length} locale${selectedExportLocales.length === 1 ? '' : 's'}`
  const hasPanoGroups = project.slideGroups.some((g) => g.numSlides > 1)

  // Initialize state when modal opens (adjust-state-during-render pattern, same as original SlideNavigator)
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setSelectedExportFormats(exportableFormats)
    setSelectedExportLocales(projectLocales)
    setCompensatePanoExport(panoSettings.compensate)
    setPanoCompensationInput(String(panoSettings.gapPx || DEFAULT_PANO_COMPENSATION_PX))
    setExportError(null)
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  // Track stage readiness (stageRef.current must not be read during render).
  // Re-checks whenever the modal opens (not just when activeGroup's memo
  // reference happens to change) and polls if the Konva stage hasn't
  // mounted yet — right after a fresh page load the stage can still be null
  // on the modal's first render, and nothing else would ever re-trigger
  // this check until something incidentally changed activeGroup (e.g.
  // opening Preview first).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setStageReady(Boolean(stageRef.current))
    if (!stageRef.current) {
      void waitForStage(stageRef, 5000).then((stage) => {
        if (!cancelled) setStageReady(Boolean(stage))
      })
    }
    return () => { cancelled = true }
  }, [stageRef, open])

  // Freely allow checking/unchecking every format or locale, including down
  // to zero — the Export button (canRunExport) is the single source of truth
  // for "you can't export like this", via disabled state. Blocking the last
  // uncheck here instead was more confusing: it silently no-ops on click
  // with no visible reason, whereas a disabled button communicates it directly.
  const toggleExportFormat = (formatId: CanvasFormatId) => {
    setSelectedExportFormats((prev) => (prev.includes(formatId)
      ? prev.filter((f) => f !== formatId)
      : [...prev, formatId]))
  }

  const toggleExportLocale = (locale: string) => {
    setSelectedExportLocales((prev) => (prev.includes(locale)
      ? prev.filter((l) => l !== locale)
      : [...prev, locale]))
  }

  const writeDirectoryFile = async (
    dirHandle: Awaited<ReturnType<NonNullable<Window['showDirectoryPicker']>>>,
    item: ProjectImageExportResult,
  ) => {
    await writeExportDirectoryFile(dirHandle, item)
  }

  const downloadResults = async (results: ProjectImageExportResult[]) => {
    for (const item of results) {
      downloadDataUrl(item.dataUrl, item.relativePath.replace(/\//g, '__'))
      await new Promise((r) => setTimeout(r, 80))
    }
  }

  const downloadZip = async (results: ProjectImageExportResult[]) => {
    const zipBlob = await buildExportZipBlob(results)
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = zipFileNameFor(project.name)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const handleRunExport = async () => {
    setExportError(null)
    if (!stageRef.current || !activeGroup) {
      setExportError('Export unavailable. Try again.')
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      setIsExporting(true)
      setExportProgress(null)
      if (exportOutput === 'folder' && !folderSupported) {
        setExportError('Folder export requires Chrome or Edge. Choose ZIP or Files instead.')
        return
      }

      const results = await exportProjectImages(stageRef.current, {
        formatIds: selectedExportFormats,
        locales: selectedExportLocales.length ? selectedExportLocales : [project.settings.defaultLocale ?? 'en'],
        scope: exportScope,
        groupIds: exportScope === 'current-group' ? [activeGroup.id] : undefined,
        panoMode,
        panoCompensate: panoMode === 'split' && compensatePanoExport,
        panoCompensationPx: panoMode === 'split' && compensatePanoExport
          ? normalizePanoCompensationPx(parseInt(panoCompensationInput, 10) || 0)
          : 0,
        signal: controller.signal,
        onProgress: (progress) => setExportProgress({ ...progress, phase: progress.phase }),
      })

      if (results.length === 0) {
        setExportError('Nothing to export for this selection.')
        return
      }

      if (exportOutput === 'zip') {
        setExportProgress((prev) => prev && { ...prev, phase: 'zipping' })
        await downloadZip(results)
      } else if (exportOutput === 'folder' && window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
          let written = 0
          for (const item of results) {
            await writeDirectoryFile(dirHandle, item)
            written += 1
            setExportProgress((prev) => prev && {
              ...prev,
              phase: 'writing',
              completed: written,
              total: results.length,
            })
          }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          throw err
        }
      } else {
        setExportProgress((prev) => prev && { ...prev, phase: 'downloading' })
        await downloadResults(results)
      }

      onClose()
    } catch (err) {
      if (err instanceof ExportCancelledError) {
        setExportError(null)
      } else {
        setExportError(err instanceof Error ? `Export failed: ${err.message} Try again.` : 'Export failed. Try again.')
      }
    } finally {
      setIsExporting(false)
      setExportProgress(null)
      setIsCancelling(false)
      abortControllerRef.current = null
    }
  }

  const handleCancelExport = () => {
    setIsCancelling(true)
    abortControllerRef.current?.abort()
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeOnEscape={!isExporting}
      closeOnBackdrop={!isExporting}
      showCloseButton={!isExporting}
      closeLabel={em.closeAria}
      maxWidth="max-w-5xl"
      backdropClassName="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
      panelClassName="relative rounded-2xl border shadow-2xl w-full h-[88dvh] max-h-[88dvh] flex flex-col overflow-hidden"
      header={<div className="px-4 sm:px-5 py-3.5 sm:py-4 pr-12 border-b border-[rgba(255,255,255,0.06)] shrink-0"><h2 className="text-base font-semibold text-[#e8e8f0]">{em.title}</h2><p className="text-xs text-[#6b6b7a] mt-0.5">{exportSummary}</p></div>}
      footerClassName="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[rgba(255,255,255,0.06)] shrink-0"
      footer={<>
        {isExporting && exportProgress && (() => {
          const isIndeterminate = exportProgress.phase === 'zipping' || exportProgress.phase === 'downloading'
          const context = exportScope === 'project'
            ? `${exportProgress.formatLabel} · ${exportProgress.locale} — ${exportProgress.groupName}`
            : `${exportProgress.formatLabel} · ${exportProgress.locale}`
          return <div className="mb-3">
            <p className="mb-1.5 text-[10px] text-[#8f90a3]">{context}</p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={exportProgress.total}
              aria-valuenow={exportProgress.completed}
              aria-valuetext={`Exporting ${exportProgress.completed} of ${exportProgress.total}: ${exportProgress.formatLabel}, ${exportProgress.locale}`}
              className="h-1 overflow-hidden rounded bg-[rgba(255,255,255,0.08)]"
            >
              <div
                className={`h-full bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none ${isIndeterminate ? 'w-full animate-pulse' : ''}`}
                style={isIndeterminate ? undefined : { width: `${(exportProgress.completed / Math.max(exportProgress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        })()}
        {isExporting ? <div className="flex flex-wrap gap-2">
          <button disabled className="flex-1 rounded-lg bg-accent-strong px-3 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-40 disabled:cursor-not-allowed">
            {exportProgress?.phase === 'rendering'
              ? `${exportProgress.completed}/${exportProgress.total} (${Math.round((exportProgress.completed / Math.max(exportProgress.total, 1)) * 100)}%)…`
              : exportProgress?.phase === 'zipping' ? em.preparingZip
                : exportProgress?.phase === 'writing' ? `${exportProgress.completed}/${exportProgress.total} (${Math.round((exportProgress.completed / Math.max(exportProgress.total, 1)) * 100)}%)`
                  : exportProgress?.phase === 'downloading' ? em.startingDownloads
                    : em.restoringState}
          </button>
          <button
            onClick={handleCancelExport}
            disabled={isCancelling}
            className="rounded-lg border border-[rgba(255,255,255,0.15)] px-3 py-2.5 text-sm font-medium text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {isCancelling ? em.cancelling : t.common.cancel}
          </button>
        </div> : <button disabled={!canRunExport} onClick={handleRunExport} className="w-full rounded-lg bg-accent-strong px-3 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-strong/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{em.exportPngs}</button>}
        {exportError ? (
          <p role="alert" className="mt-2 rounded border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-2 py-1.5 text-[10px] leading-snug text-[#fca5a5]">{exportError}</p>
        ) : !isExporting && selectedExportFormats.length === 0 ? (
          <p className="mt-2 text-[10px] leading-snug text-[#f59e0b]">{em.selectFormatWarning}</p>
        ) : !isExporting && selectedExportLocales.length === 0 ? (
          <p className="mt-2 text-[10px] leading-snug text-[#f59e0b]">{em.selectLocaleWarning}</p>
        ) : (
          <p className="text-[10px] leading-snug text-[#6b6b7a] mt-2">{em.structureHint}</p>
        )}
      </>}
    >
        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Scope */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a] mb-3">{em.scope}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: 'project' as const, label: em.allGroups, help: `${project.slideGroups.length}` },
                { value: 'current-group' as const, label: em.currentGroup, help: activeGroup?.name ?? em.currentGroup },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setExportScope(item.value)}
                  className={`min-w-0 text-left rounded border px-2.5 py-2 transition-colors ${exportScope === item.value
                    ? 'border-accent bg-accent-soft text-white'
                    : 'border-[rgba(255,255,255,0.08)] text-[#a6a7b8] hover:border-[rgba(255,255,255,0.18)]'}`}
                >
                  <span className="block text-[11px] font-medium">{item.label}</span>
                  <span className="block text-[10px] text-[#6b6b7a] mt-0.5 truncate">{item.help}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export formats */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a] mb-3">{em.exportFormats}</p>
            {exportableFormats.length === 0 ? (
              <p className="text-[10px] leading-snug text-[#6b6b7a]">
                {em.noFormatsHint}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {exportableFormats.map((formatId) => {
                  // getCanvasFormat('base') resolves to a legacy iPhone-preset stub, not the
                  // group's real authoring size — use getFormatCanvasDims (group-aware) so the
                  // checklist shows the actual export size when Base is the sole export target.
                  const format = rawActiveGroup
                    ? getFormatCanvasDims(rawActiveGroup, formatId, baseFormat, project.settings.customFormats)
                    : getCanvasFormat(formatId, project.settings.customFormats)
                  const isChecked = selectedExportFormats.includes(formatId)
                  const hasLayouts = project.slideGroups.some((group) => groupTargetsFormat(group, formatId))
                  const adjustments = rawActiveGroup
                    ? countFormatAdjustments(rawActiveGroup, formatId, baseFormat)
                    : 0
                  return (
                    <label
                      key={formatId}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 py-0.5 rounded cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleExportFormat(formatId)}
                        className="accent-accent w-3 h-3 shrink-0"
                      />
                      <span className="min-w-0 text-[11px] text-[#e8e8f0] flex-1 truncate">
                        {getFormatLabel(formatId, project.settings.customFormats)}
                      </span>
                      <span className="text-[10px] text-[#6b6b7a] shrink-0">
                        {format.width}×{format.height}{!hasLayouts && ' · —'}
                      </span>
                      {adjustments > 0 ? (
                        <span className="text-[9px] text-[#f59e0b] bg-[rgba(245,158,11,0.1)] rounded px-1 py-px shrink-0">
                          {em.adjusted} ({adjustments})
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#6b6b7a] bg-[rgba(255,255,255,0.05)] rounded px-1 py-px shrink-0">
                          {t.common.auto}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Locales */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a] mb-3">{em.locales}</p>
            <div className="flex flex-wrap gap-1.5">
              {projectLocales.map((locale) => {
                const checked = selectedExportLocales.includes(locale)
                const singleLocale = projectLocales.length === 1
                return (
                  <button
                    key={locale}
                    type="button"
                    disabled={singleLocale}
                    onClick={() => { if (!singleLocale) toggleExportLocale(locale) }}
                    className={`text-[11px] rounded-full border px-2 py-1 transition-colors ${checked
                      ? 'border-accent bg-accent-soft text-white'
                      : 'border-[rgba(255,255,255,0.08)] text-[#8f90a3] hover:text-white'} ${singleLocale ? 'cursor-default opacity-80' : ''}`}
                  >
                    {locale}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pano groups */}
          {hasPanoGroups && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a] mb-3">{em.panoGroups}</p>
              <div className="rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2">
                <label className="flex flex-wrap items-center gap-2 text-[11px] text-[#a6a7b8]">
                  <ToggleSwitch
                    variant="checkbox"
                    checked={compensatePanoExport}
                    onChange={setCompensatePanoExport}
                    checkboxClassName="h-3 w-3 accent-accent"
                  />
                  <span className="flex-1">{em.compensateStoreGap}</span>
                  <NumberInput
                    min={0}
                    max={MAX_PANO_COMPENSATION_PX}
                    value={panoCompensationInput}
                    disabled={!compensatePanoExport}
                    onValueChange={(_value, raw) => setPanoCompensationInput(raw)}
                    onBlur={() => {
                      const next = normalizePanoCompensationPx(parseInt(panoCompensationInput, 10) || 0)
                      setPanoCompensationInput(String(next || DEFAULT_PANO_COMPENSATION_PX))
                    }}
                    className="w-14 rounded border border-[rgba(255,255,255,0.12)] bg-[#0f0f13] px-1 py-0.5 text-right text-[#e8e8f0] disabled:opacity-40"
                  />
                  <span className="text-[#6b6b7a]">px</span>
                </label>
                <p className="mt-1 text-[9px] leading-snug text-[#6b6b7a]">
                  {em.compensateStoreGapHint}
                </p>
              </div>
            </div>
          )}

          {/* Output */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a] mb-3">{em.output}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { value: 'zip' as const, label: 'ZIP', help: em.zipHelp },
                { value: 'folder' as const, label: em.folder, help: folderSupported ? em.folderHelp : 'Chrome/Edge' },
                { value: 'downloads' as const, label: em.files, help: em.filesHelp },
              ].map((item) => {
                const disabled = item.value === 'folder' && !folderSupported
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setExportOutput(item.value)}
                    className={`min-w-0 text-left rounded border px-2 py-1.5 transition-colors ${exportOutput === item.value
                      ? 'border-accent bg-accent-soft text-white'
                      : 'border-[rgba(255,255,255,0.08)] text-[#8f90a3] hover:text-white'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="block text-[11px] font-medium">{item.label}</span>
                    <span className="block text-[9px] text-[#6b6b7a] mt-0.5">{item.help}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

    </ModalShell>
  )
}
