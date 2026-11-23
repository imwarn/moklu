/**
 * [INPUT]: depends on react, zustand useShallow, useTemplatesStore, useEditorStore, importValidation, export, templateAppearance, ModalShell, FileUploadButton, and useStudioLocale from @/i18n
 * [OUTPUT]: exports TemplatesModal gallery, import/export, and appearance restyling dialog localized across EN/ZH/JA/KO
 * [POS]: template discovery and application modal inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTemplatesStore, toAbsolute } from '@/store/templates'
import { useEditorStore } from '@/store'
import { checkImportFileSize, parseBoundedImportJson, validateTemplateImport } from '@/utils/importValidation'
import { downloadDataUrl } from '@/utils/export'
import type { TemplateApplyMode, TemplateAppearanceParts } from '@/utils/templateAppearance'
import { ModalShell } from '@/components/ui/ModalShell'
import { FileUploadButton } from '@/components/ui/FileUploadButton'
import { useStudioLocale } from '@/i18n'

interface TemplatesModalProps {
  open: boolean
  onClose: () => void
}

export function TemplatesModal({ open, onClose }: TemplatesModalProps) {
  const { t } = useStudioLocale()
  const tm = t.modals.templates
  const { manifest, loading, error, loadManifest, fetchTemplate } = useTemplatesStore()
  const { project, exportActiveAsTemplate, addTemplateSlideGroups, applyTemplateToActiveCanvas } =
    useEditorStore(useShallow((s) => ({
      project: s.project,
      exportActiveAsTemplate: s.exportActiveAsTemplate,
      addTemplateSlideGroups: s.addTemplateSlideGroups,
      applyTemplateToActiveCanvas: s.applyTemplateToActiveCanvas,
    })))

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const categories = Array.from(new Set(manifest.map((entry) => entry.category).filter((value): value is string => Boolean(value)))).sort()
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const filteredManifest = manifest.filter((entry) =>
    (categoryFilter === 'all' || entry.category === categoryFilter) &&
    (!normalizedSearch || [entry.name, entry.description, entry.category].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))),
  )
  const [applying, setApplying] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [canvasApplyMode, setCanvasApplyMode] = useState<TemplateApplyMode>('layout')
  const [appearanceParts, setAppearanceParts] = useState<TemplateAppearanceParts>({
    background: true, frame: true, typography: true,
  })
  const selectedAppearancePartCount = Object.values(appearanceParts).filter(Boolean).length
  const setAppearancePart = (part: keyof TemplateAppearanceParts, checked: boolean) => {
    setAppearanceParts((previous) => ({ ...previous, [part]: checked }))
  }
  const [exportOpen, setExportOpen] = useState(false)

  const [exportName, setExportName] = useState('')
  const [exportDescription, setExportDescription] = useState('')
  const [exportCategory, setExportCategory] = useState('')

  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) loadManifest() }, [open, loadManifest])
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExportName(project.name)
    }
  }, [open, project.name])

  const handleGalleryApply = async (entry: typeof manifest[0], action: 'canvas' | 'append') => {
    setApplying(entry.slug)
    setGalleryError(null)
    try {
      const tpl = await fetchTemplate(entry)
      if (action === 'canvas') {
        const state = useEditorStore.getState()
        const active = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)
        if (!active || active.numSlides !== 1) {
          throw new Error('Choose a single-slide canvas before applying a style.')
        }
        const hasExtra = active.layers.some((layer) => layer.type !== 'background' && layer.type !== 'phone')
        if (canvasApplyMode === 'layout' && hasExtra && !window.confirm('Apply this template? Existing text and decorations will be replaced, but your screenshot will be preserved.')) return
        applyTemplateToActiveCanvas(tpl, canvasApplyMode, appearanceParts)
      } else {
        addTemplateSlideGroups(tpl)
      }
      onClose()
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'Unable to apply template.')
    } finally {
      setApplying(null)
    }
  }

  const handleExport = () => {
    if (!exportName.trim()) return
    const tpl = exportActiveAsTemplate({
      name: exportName.trim(),
      description: exportDescription.trim() || undefined,
      category: exportCategory.trim() || undefined,
    })
    const json = JSON.stringify(tpl, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const slug = exportName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    downloadDataUrl(url, `${slug || 'template'}.template.json`)
    URL.revokeObjectURL(url)
    onClose()
  }

  const handleImportFile = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setImportError(null)
    try {
      checkImportFileSize(file.size)
      const tpl = validateTemplateImport(parseBoundedImportJson(await file.text()))
      addTemplateSlideGroups(tpl)
      onClose()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read template file.')
    }
  }

  /* ─── shared input style ─────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    display: 'block',
    marginTop: 5,
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#e8e8f0',
    fontSize: 12,
    padding: '6px 10px',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      onEscape={() => exportOpen ? setExportOpen(false) : onClose()}
      maxWidth=""
      backdropClassName="fixed inset-0 z-[200] flex items-center justify-center"
      backdropStyle={{ background: 'rgba(0,0,0,0.6)' }}
      panelClassName=""
      panelStyle={{ width: 680, maxHeight: '80vh', background: '#18181f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}
      showCloseButton={false}
      header={<div
          style={{
            padding: '14px 16px 14px 20px',
            borderBottom: exportOpen
              ? 'none'
              : '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Title */}
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: '#e8e8f0',
              letterSpacing: '-0.01em',
            }}
          >
            {tm.title}
          </span>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Import */}
            <button
              onClick={() => importRef.current?.click()}
              title={tm.importTitle}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#a0a0b0',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
                e.currentTarget.style.color = '#c8c8d8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#a0a0b0'
              }}
            >
              <span style={{ fontSize: 11 }}>↑</span>
              {t.common.import}
            </button>

            {/* Export */}
            <button
              onClick={() => setExportOpen((v) => !v)}
              title={tm.exportTitle}
              style={{
                background: exportOpen ? 'var(--color-accent-soft)' : 'rgba(255,255,255,0.04)',
                border: exportOpen
                  ? '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: exportOpen ? 'var(--color-accent-text)' : 'var(--color-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!exportOpen) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
                  e.currentTarget.style.color = '#c8c8d8'
                }
              }}
              onMouseLeave={(e) => {
                if (!exportOpen) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#a0a0b0'
                }
              }}
            >
              <span style={{ fontSize: 11 }}>⬇</span>
              {t.common.export}
            </button>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 20,
                background: 'rgba(255,255,255,0.08)',
                margin: '0 2px',
              }}
            />

            {/* Close */}
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
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0b0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6b7a' }}
            >
              ×
            </button>
          </div>
        </div>}
      footerClassName=""
      footer={<div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#4a4a5a', textAlign: 'center', flexShrink: 0 }}>Add templates to <code style={{ background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: 3 }}>public/templates/</code> to include them in the gallery</div>}
    >

        {/* ── Export panel (inline collapsible) ──────────────── */}
        {exportOpen && (
          <div
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
              borderBottom: '1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)',
              padding: '16px 20px',
              flexShrink: 0,
            }}
          >
            {/* Description */}
            <p
              style={{
                margin: '0 0 14px',
                fontSize: 12,
                color: '#6b6b7a',
                lineHeight: 1.5,
              }}
            >
              Export the current project as a shareable{' '}
              <code
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontSize: 11,
                  color: '#a0a0b0',
                }}
              >
                .template.json
              </code>{' '}
              file. Screenshots and asset references are removed — each user adds their own.
            </p>

            {/* Form: Name + Category in one row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <label
                style={{
                  flex: 2,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#8a8a9a',
                }}
              >
                {tm.nameRequired}
                <input
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="e.g. Minimal Hero"
                  style={inputStyle}
                />
              </label>
              <label
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#8a8a9a',
                }}
              >
                {tm.category}
                <input
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  placeholder="minimal, bold…"
                  style={inputStyle}
                />
              </label>
            </div>

            {/* Description textarea */}
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                color: '#8a8a9a',
                marginBottom: 12,
              }}
            >
              {tm.description}
              <textarea
                value={exportDescription}
                onChange={(e) => setExportDescription(e.target.value)}
                placeholder={tm.description}
                rows={2}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </label>

            {/* Download button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleExport}
                disabled={!exportName.trim()}
                style={{
                  background: exportName.trim() ? 'var(--color-accent-strong)' : 'color-mix(in srgb, var(--color-accent-strong) 30%, transparent)',
                  border: 'none',
                  borderRadius: 6,
                  color: exportName.trim() ? '#fff' : 'rgba(255,255,255,0.35)',
                  cursor: exportName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⬇</span>
                {tm.downloadTemplate}
              </button>
            </div>
          </div>
        )}

        {/* ── Gallery ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Hidden file input for Import */}
          <FileUploadButton
            ref={importRef}
            accept=".json"
            className="hidden"
            onFiles={handleImportFile}
          >Import template</FileUploadButton>

          {/* Import error (shown inline in gallery area) */}
          {importError && (
            <div
              style={{
                marginBottom: 14,
                padding: '9px 12px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 7,
                fontSize: 12,
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠</span>
              {importError}
              <button
                onClick={() => setImportError(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </div>
          )}

          {loading && (
            <p style={{ textAlign: 'center', color: '#6b6b7a', fontSize: 13, marginTop: 32 }}>
              {tm.loading}
            </p>
          )}
          {error && (
            <p style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginTop: 32 }}>
              {tm.loadFailed}
            </p>
          )}

          {!loading && manifest.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                color: '#6b6b7a',
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗂</div>
              <p style={{ margin: '0 0 6px', color: '#a0a0b0', fontWeight: 500 }}>
                {tm.emptyTitle}
              </p>
              <p style={{ margin: 0, fontSize: 11 }}>
                <code
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  public/templates/
                </code>
              </p>
            </div>
          )}

          <fieldset className="mb-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <legend className="px-1 text-xs font-semibold text-[#dedee8]">{tm.applyModeLegend}</legend>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${canvasApplyMode === 'layout' ? 'border-accent bg-accent-soft' : 'border-white/10'}`}>
                <input type="radio" name="template-apply-mode" checked={canvasApplyMode === 'layout'} onChange={() => setCanvasApplyMode('layout')} />
                <span><strong className="block text-white">{tm.layoutModeTitle}</strong><span className="mt-1 block text-[#aeb0c3]">{tm.layoutModeDesc}</span></span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${canvasApplyMode === 'appearance' ? 'border-accent bg-accent-soft' : 'border-white/10'}`}>
                <input type="radio" name="template-apply-mode" checked={canvasApplyMode === 'appearance'} onChange={() => setCanvasApplyMode('appearance')} />
                <span><strong className="block text-white">{tm.styleOnlyTitle}</strong><span className="mt-1 block text-[#aeb0c3]">{tm.styleOnlyDesc}</span></span>
              </label>
            </div>
          </fieldset>
          {canvasApplyMode === 'appearance' && (
            <fieldset className="mb-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <legend className="px-1 text-xs font-semibold text-[#dedee8]">{tm.restyleLegend}</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  ['background', tm.restyleBg, tm.restyleBgDesc],
                  ['frame', tm.restyleFrame, tm.restyleFrameDesc],
                  ['typography', tm.restyleText, tm.restyleTextDesc],
                ] as const).map(([key, label, description]) => (
                  <label key={key} className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 p-2.5 text-xs text-[#dedee8]">
                    <input type="checkbox" checked={appearanceParts[key]}
                      onChange={(event) => setAppearancePart(key, event.target.checked)} />
                    <span><strong className="block">{label}</strong><span className="mt-1 block text-[11px] leading-4 text-[#9da0b5]">{description}</span></span>
                  </label>
                ))}
              </div>
              {selectedAppearancePartCount === 0 && (
                <p role="alert" className="mt-2 text-xs text-amber-300">{tm.selectOneWarning}</p>
              )}
            </fieldset>
          )}
          {galleryError && (
            <p role="alert" className="mb-3 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-xs text-red-300">{galleryError}</p>
          )}
          {manifest.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 sm:flex-row" role="search" aria-label={tm.searchLabel}>
              <label className="flex-1 text-xs text-[#aeb0c3]">{tm.searchLabel}
                <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tm.searchPlaceholder} className="mt-1 w-full rounded-lg border border-white/20 bg-[#222330] p-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-accent" />
              </label>
              <label className="text-xs text-[#aeb0c3]">{tm.category}
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#222330] p-2 text-sm text-white sm:min-w-40">
                  <option value="all">{tm.allCategories}</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>
          )}
          {manifest.length > 0 && filteredManifest.length === 0 && (
            <p role="status" className="mb-4 rounded-lg border border-white/10 p-4 text-sm text-[#aeb0c3]">
              {tm.noMatches}
            </p>
          )}
          {filteredManifest.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {filteredManifest.map((entry) => (
                <div
                  key={entry.slug}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      background: 'rgba(255,255,255,0.04)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {entry.thumbnail ? (
                      <img
                        src={toAbsolute(entry.thumbnail)}
                        alt={entry.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '12px 10px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {entry.category && (
                          <div
                            style={{
                              background: 'var(--color-accent-soft)',
                              border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                              borderRadius: 20,
                              color: 'var(--color-accent-text)',
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: '0.06em',
                              padding: '2px 8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {entry.category}
                          </div>
                        )}
                        <div
                          style={{
                            color: '#e8e8f0',
                            fontSize: 13,
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: 1.3,
                          }}
                        >
                          {entry.name}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            marginTop: 4,
                          }}
                        >
                          {entry.slides != null && (
                            <div style={{ color: '#6b6b7a', fontSize: 10 }}>
                              {entry.slides} {entry.slides === 1 ? 'slide' : 'slides'}
                            </div>
                          )}
                          {entry.previewSize && (
                            <div style={{ color: '#4a4a5a', fontSize: 9, fontFamily: 'monospace' }}>
                              {entry.previewSize}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info + actions */}
                  <div style={{ padding: '10px 10px 8px' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#e8e8f0',
                        marginBottom: 3,
                      }}
                    >
                      {entry.name}
                    </div>
                    {entry.description && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#6b6b7a',
                          marginBottom: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        {entry.description}
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-2">
                      <button
                        disabled={applying === entry.slug || (canvasApplyMode === 'appearance' && selectedAppearancePartCount === 0)}
                        onClick={() => { void handleGalleryApply(entry, 'canvas') }}
                        className="rounded-md bg-accent-strong px-3 py-2 text-xs font-semibold text-accent-fg hover:bg-accent-strong/90 disabled:opacity-50"
                        title={canvasApplyMode === 'appearance' ? 'Change appearance without replacing any content or geometry' : 'Use template composition, preserving the main screenshot'}
                      >
                        {applying === entry.slug ? tm.applying : canvasApplyMode === 'appearance' ? tm.applyStyleKeepLayers : tm.useOnCurrentCanvas}
                      </button>
                      <button
                        disabled={applying === entry.slug}
                        onClick={() => { void handleGalleryApply(entry, 'append') }}
                        className="rounded-md border border-white/15 px-3 py-2 text-xs text-[#aeb0c3] hover:border-white/30 hover:text-white disabled:opacity-50"
                      >
                        {tm.addSlidesToProject}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

    </ModalShell>
  )
}
