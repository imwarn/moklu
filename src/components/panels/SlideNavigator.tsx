/**
 * [INPUT]: depends on react, konva, zustand useShallow, @dnd-kit/core, @dnd-kit/sortable, useEditorStore, canvasFormats, panoGeometry, ExportModal, contextMenu and studioTokens from @/components/ui, and useStudioLocale from @/i18n
 * [OUTPUT]: exports SlideNavigator bottom filmstrip component with AA contrast, ARIA state, viewport-clamped accessible context menu, and localized Slides controls
 * [POS]: bottom slide navigation footer of StudioPage inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import type Konva from 'konva'
import { useShallow } from 'zustand/react/shallow'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '@/store'
import { fillToCss } from '@/utils/gradients'
import { BASE_CANVAS_FORMAT, getExportTargets, getFormatCanvasDims, getProjectBaseFormat, selectFormatViewGroups } from '@/utils/canvasFormats'
import { MAX_PANO_COMPENSATION_PX } from '@/utils/panoGeometry'
import type { BackgroundLayer, SlideGroup } from '@/types'
import type { ThumbnailMap } from '@/hooks/useThumbnails'
import { useClampedMenuPosition, useContextMenuKeyboard } from '@/components/ui/contextMenu'
import {
  STUDIO_COLORS,
  STUDIO_SECTION_LABEL_CLS,
  STUDIO_TEXT_MUTED_CLS,
  STUDIO_TEXT_SUBTLE_CLS,
} from '@/components/ui/studioTokens'
import { ExportModal } from './ExportModal'
import { useStudioLocale } from '@/i18n'

interface ContextMenu {
  groupId: string
  x: number
  y: number
}

const SLIDE_MENU_ESTIMATED_WIDTH = 152
const SLIDE_MENU_ESTIMATED_HEIGHT = 112

function SlideContextMenu({
  contextMenu,
  canDelete,
  onAction,
  onClose,
}: {
  contextMenu: ContextMenu
  canDelete: boolean
  onAction: (action: string, groupId: string) => void
  onClose: () => void
}) {
  const { t } = useStudioLocale()
  const menuRef = useRef<HTMLDivElement>(null)
  const position = useClampedMenuPosition(
    menuRef,
    contextMenu.x,
    contextMenu.y,
    SLIDE_MENU_ESTIMATED_WIDTH,
    SLIDE_MENU_ESTIMATED_HEIGHT,
    { flipY: true },
  )

  useContextMenuKeyboard(menuRef, true, onClose)

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={t.slides.title}
      className="fixed z-50 py-1 rounded shadow-2xl border focus:outline-none"
      style={{
        left: position.left,
        top: position.top,
        background: STUDIO_COLORS.surfacePanel,
        borderColor: STUDIO_COLORS.borderSubtle,
        minWidth: 140,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {[
        { action: 'rename', label: t.common.rename },
        { action: 'duplicate', label: t.common.duplicate },
      ].map(({ action, label }) => (
        <button
          key={action}
          type="button"
          role="menuitem"
          className="w-full text-left px-3 py-2 text-xs hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:bg-[rgba(255,255,255,0.1)] transition-colors"
          style={{ color: STUDIO_COLORS.textPrimary }}
          onClick={() => onAction(action, contextMenu.groupId)}
        >
          {label}
        </button>
      ))}
      <div role="separator" className="my-1 border-t border-[rgba(255,255,255,0.08)]" />
      <button
        type="button"
        role="menuitem"
        disabled={!canDelete}
        className="w-full text-left px-3 py-2 text-xs text-[#f87171] hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:bg-[rgba(255,255,255,0.1)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        onClick={() => onAction('delete', contextMenu.groupId)}
      >
        {t.common.delete}
      </button>
    </div>
  )
}

interface SlideNavigatorProps {
  thumbnails: ThumbnailMap
  staleGroupIds: Set<string>
  stageRef: React.RefObject<Konva.Stage | null>
  onCaptureThumbnail: (groupId: string) => void
  onOpenPreview: () => void
}

type FlatSlide = {
  group: SlideGroup
  slideIdx: number
  globalNum: number
  bgCss: string
}

interface SortableGroupItemProps {
  group: SlideGroup
  groupSlides: FlatSlide[]
  isActive: boolean
  isFirst: boolean
  renamingId: string | null
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  thumbnails: ThumbnailMap
  staleGroupIds: Set<string>
  captureThumbnail: (groupId: string) => void
  THUMB_H: number
  handleContextMenu: (e: React.MouseEvent, groupId: string) => void
  startRename: (groupId: string, currentName: string) => void
  setActiveSlideGroup: (id: string) => void
  commitRename: () => void
  setRenamingId: (id: string | null) => void
  setRenameValue: (v: string) => void
}

function SortableGroupItem({
  group,
  groupSlides,
  isActive,
  isFirst,
  renamingId,
  renameValue,
  renameInputRef,
  thumbnails,
  staleGroupIds,
  captureThumbnail,
  THUMB_H,
  handleContextMenu,
  startRename,
  setActiveSlideGroup,
  commitRename,
  setRenamingId,
  setRenameValue,
}: SortableGroupItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id })
  const thumbW = Math.min(50, Math.round((group.slideWidth / group.slideHeight) * THUMB_H))
  const slideGap = 6
  const stripWidth = (thumbW * groupSlides.length) + (slideGap * Math.max(0, groupSlides.length - 1))

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  }

  return (
    <div ref={setNodeRef} style={wrapperStyle} {...attributes} {...listeners}>
      {/* Visual divider between groups */}
      {!isFirst && (
        <div
          style={{
            width: 1,
            height: 32,
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
            alignSelf: 'center',
          }}
        />
      )}

      {/* The group header is constrained to the exact width of its thumbnail strip.
          It must not widen a narrow slide and create invisible side gutters between
          previews. Pano/strip slides keep their tighter inner gap as one visual unit. */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 2, width: stripWidth, flexShrink: 0 }}
        onContextMenu={(e) => handleContextMenu(e, group.id)}
        onDoubleClick={() => startRename(group.id, group.name)}
      >
        {renamingId === group.id ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: Math.max(stripWidth, 52), height: 14, fontSize: 9, boxSizing: 'border-box' }}
            className="px-1 rounded border border-accent bg-surface text-[#e8e8f0] focus:outline-none"
          />
        ) : (
          <span
            style={{
              width: '100%',
              fontSize: 10,
              color: isActive ? STUDIO_COLORS.textAccent : STUDIO_COLORS.textMuted,
              lineHeight: '14px',
              height: 14,
              cursor: 'default',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
            title={group.name}
          >
            {group.name}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: slideGap }}>
          {groupSlides.map(({ slideIdx, globalNum: num, bgCss }) => {
            const thumb = thumbnails[group.id]?.[slideIdx]

            return (
              <Fragment key={`${group.id}-${slideIdx}`}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}
                  className="relative shrink-0 group"
                >
                  <div
                    style={{
                      width: thumbW,
                      height: THUMB_H,
                      background: bgCss,
                      border: `1px solid ${isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 4,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      setActiveSlideGroup(group.id)
                      if (!thumb || staleGroupIds.has(group.id)) captureThumbnail(group.id)
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`Slide ${num}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                        }}
                      >
                        📱
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: 9, color: isActive ? STUDIO_COLORS.textAccent : STUDIO_COLORS.textMuted, lineHeight: 1 }}>
                    {num}
                  </span>
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SlideNavigator({ thumbnails, staleGroupIds, stageRef, onCaptureThumbnail, onOpenPreview }: SlideNavigatorProps) {
  const { t } = useStudioLocale()
  const {
    project,
    activeSlideGroupId,
    setActiveSlideGroup,
    setActiveCanvasFormat,
    addSlideGroup,
    removeSlideGroup,
    duplicateSlideGroup,
    updateSlideGroup,
    reorderSlideGroups,
    activeCanvasFormat,
    activeFamily,
    panoSettings,
    updatePanoSettings,
  } = useEditorStore(useShallow((s) => ({
    project: s.project,
    activeSlideGroupId: s.activeSlideGroupId,
    setActiveSlideGroup: s.setActiveSlideGroup,
    setActiveCanvasFormat: s.setActiveCanvasFormat,
    addSlideGroup: s.addSlideGroup,
    removeSlideGroup: s.removeSlideGroup,
    duplicateSlideGroup: s.duplicateSlideGroup,
    updateSlideGroup: s.updateSlideGroup,
    reorderSlideGroups: s.reorderSlideGroups,
    activeCanvasFormat: s.activeCanvasFormat,
    activeFamily: s.activeFamily,
    panoSettings: s.project.settings.pano ?? { gapPx: 24, compensate: false },
    updatePanoSettings: s.updatePanoSettings,
  })))

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const baseFormat = getProjectBaseFormat(project)
  const viewProject = {
    ...project,
    slideGroups: project.slideGroups.map((group) => ({
      ...group,
      ...getFormatCanvasDims(group, activeCanvasFormat, baseFormat, project.settings.customFormats),
    })),
  }
  const visibleGroups = selectFormatViewGroups(viewProject, activeCanvasFormat, activeFamily)
  const activeGroup = viewProject.slideGroups.find((g) => g.id === activeSlideGroupId)
  // Whether ANY slide group in the project is a pano/strip — not just the active
  // one — since panoSettings.compensate is a project-wide setting.
  const hasPano = project.slideGroups.some((g) => g.numSlides > 1)

  // The formats currently active for this project
  // Export targets — Base is used when no platform or custom formats are active.
  const exportableFormats = getExportTargets(project)

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  // Focus rename input
  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 30)
  }, [renamingId])

  const startRename = (groupId: string, currentName: string) => {
    setContextMenu(null)
    setRenamingId(groupId)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) updateSlideGroup(renamingId, { name: renameValue.trim() })
    setRenamingId(null)
    setRenameValue('')
  }

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handleContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ groupId, x: e.clientX, y: e.clientY })
  }

  const selectSlideGroup = (id: string) => {
    const group = project.slideGroups.find((candidate) => candidate.id === id)
    if (group && !visibleGroups.some((visibleGroup) => visibleGroup.id === group.id)) setActiveCanvasFormat(BASE_CANVAS_FORMAT)
    setActiveSlideGroup(id)
  }

  const handleMenuAction = (action: string, groupId: string) => {
    setContextMenu(null)
    switch (action) {
      case 'rename': {
        const group = project.slideGroups.find((g) => g.id === groupId)
        if (group) startRename(groupId, group.name)
        break
      }
      case 'duplicate': duplicateSlideGroup(groupId); break
      case 'delete':
        if (project.slideGroups.length > 1) removeSlideGroup(groupId)
        break
    }
  }

  // Build flat slide list with global sequential numbers (used for globalNum lookup)
  const flatSlides: FlatSlide[] = []
  let globalNum = 0
  for (const group of visibleGroups) {
    const bgLayer = group.layers.find((l) => l.type === 'background') as BackgroundLayer | undefined
    const bgFill = bgLayer?.fill ?? group.background?.fill
    const bgCss = bgFill ? fillToCss(bgFill) : '#1a1a2e'
    for (let i = 0; i < group.numSlides; i++) {
      globalNum++
      flatSlides.push({ group, slideIdx: i, globalNum, bgCss })
    }
  }

  const THUMB_H = 44
  const borderColor = 'rgba(255,255,255,0.06)'

  // ─── Drag-and-drop ───────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = visibleGroups.map((g) => g.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    const reorderedVisibleIds = arrayMove(ids, oldIndex, newIndex)
    let nextVisibleIndex = 0
    reorderSlideGroups(project.slideGroups.map((group) => (
      visibleGroups.some((visibleGroup) => visibleGroup.id === group.id) ? reorderedVisibleIds[nextVisibleIndex++] : group.id
    )))
  }

  return (
    <footer
      className="min-h-20 flex flex-wrap items-center gap-3 px-3 py-2 shrink-0 border-t"
      style={{ background: '#18181f', borderColor }}
    >
      {/* Width follows the responsive LayersPanel width, less this footer's 12px inset. */}
      <div className="flex w-[196px] shrink-0 flex-col gap-1.5 border-r border-[rgba(255,255,255,0.06)] pr-3 min-[1440px]:w-[212px]">
        <div className={STUDIO_SECTION_LABEL_CLS}>{t.slides.title}</div>
        {activeGroup && (
          <div className="flex items-center gap-1.5">
            {([
              { value: 1, label: t.slides.single },
              { value: 2, label: t.slides.pano },
              { value: 3, label: t.slides.strip },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={activeGroup.numSlides === value}
                onClick={() => updateSlideGroup(activeGroup.id, { numSlides: value })}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                  activeGroup.numSlides === value
                    ? 'bg-accent-strong border-accent-strong text-accent-fg'
                    : `border-[rgba(255,255,255,0.08)] ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0] hover:border-[rgba(255,255,255,0.15)]`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {/* Always rendered (even with no pano groups) so this column's height never
            shifts the numSlides buttons when switching between Single/Pano/Strip. */}
        <label
          className={`flex items-center gap-1.5 text-[10px] ${hasPano ? STUDIO_TEXT_MUTED_CLS : STUDIO_TEXT_SUBTLE_CLS}`}
        >
          <input
            type="checkbox"
            checked={hasPano && panoSettings.compensate}
            disabled={!hasPano}
            onChange={(e) => updatePanoSettings({ compensate: e.target.checked })}
            className="h-3 w-3 accent-accent disabled:opacity-40 disabled:cursor-not-allowed"
            title={t.slides.compensateTitle}
          />
          <span>{t.slides.compensate}</span>
          <span className="ml-1">{t.slides.gap}</span>
          <input
            type="number"
            min={0}
            max={MAX_PANO_COMPENSATION_PX}
            value={panoSettings.gapPx}
            disabled={!hasPano}
            onChange={(e) => updatePanoSettings({ gapPx: parseInt(e.target.value, 10) || 0 })}
            className="w-12 rounded border border-[rgba(255,255,255,0.1)] bg-[#0f0f13] px-1 py-0.5 text-right text-[#e8e8f0] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            title={t.slides.gapTitle}
          />
          <span>px</span>
        </label>
      </div>

      <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleGroups.map((g) => g.id)} strategy={horizontalListSortingStrategy}>
            {visibleGroups.map((group, groupIdx) => {
              const groupSlides = flatSlides.filter((fs) => fs.group.id === group.id)
              return (
                <SortableGroupItem
                  key={group.id}
                  group={group}
                  groupSlides={groupSlides}
                  isActive={group.id === activeSlideGroupId}
                  isFirst={groupIdx === 0}
                  renamingId={renamingId}
                  renameValue={renameValue}
                  renameInputRef={renameInputRef}
                  thumbnails={thumbnails}
                  staleGroupIds={staleGroupIds}
                  captureThumbnail={onCaptureThumbnail}
                  THUMB_H={THUMB_H}
                  handleContextMenu={handleContextMenu}
                  startRename={startRename}
                  setActiveSlideGroup={selectSlideGroup}
                  commitRename={commitRename}
                  setRenamingId={setRenamingId}
                  setRenameValue={setRenameValue}
                />
              )
            })}
          </SortableContext>
        </DndContext>

        {/* Add slide group button — kept outside SortableContext so it's not draggable */}
        <button
          type="button"
          onClick={addSlideGroup}
          aria-label={t.slides.addSlideGroup}
          title={t.slides.addSlideGroup}
          className={`shrink-0 w-8 h-8 flex items-center justify-center ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0] rounded border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] text-base transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
        >
          <span aria-hidden="true">＋</span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0 border-l border-[rgba(255,255,255,0.06)] pl-3">
        <button
          type="button"
          onClick={onOpenPreview}
          className="text-xs text-[#e8e8f0] px-3 py-2 rounded border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          {t.slides.previewSlides}
        </button>

        <button
          type="button"
          onClick={() => setExportOpen(true)}
          disabled={exportableFormats.length === 0}
          className="text-xs text-accent-fg px-3 py-2 rounded bg-accent-strong hover:bg-accent-strong/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t.slides.export}
        </button>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} stageRef={stageRef} />

      {/* Context menu */}
      {contextMenu && (
        <SlideContextMenu
          contextMenu={contextMenu}
          canDelete={project.slideGroups.length > 1}
          onAction={handleMenuAction}
          onClose={closeContextMenu}
        />
      )}
    </footer>
  )
}
