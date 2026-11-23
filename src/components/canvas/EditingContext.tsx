/**
 * [INPUT]: depends on react, react-dom, zustand useShallow, useEditorStore, canvasFormats, locale, scopedEditingIndicator, EditingContextChrome, CreateFormatLayoutModal, ContentSyncModal, ConfirmDialog, studioTokens from @/components/ui/studioTokens, and useStudioLocale from @/i18n
 * [OUTPUT]: exports EditingContextBar and EditingContextAlert with WCAG AA contrast and localized Format, Base, Locale, Actions, and scoped editing banners
 * [POS]: persistent top canvas-context bar above StageCanvas inside src/components/canvas
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store'
import { STUDIO_TEXT_MUTED_CLS, STUDIO_TEXT_SUBTLE_CLS } from '@/components/ui/studioTokens'
import type { BuiltInFormatId, CanvasFormatId, CustomFormatId } from '@/types'
import {
  CANVAS_FORMAT_PRESETS,
  countFormatAdjustments,
  countLocaleAdjustments,
  FORMAT_FAMILY,
  FORMAT_FAMILY_LABELS,
  FORMAT_FAMILY_ORDER,
  getCanvasFormat,
  getFormatLabel,
  getFormatFamilyKey,
  getGroupFamilyKey,
  hasFormatLayout,
  getProjectActiveFormats,
  getProjectBaseFormat,
  groupTargetsFormat,
  isCustomFormatId,
  selectFamilyFormats,
  selectFamilyGroups,
  selectProjectFamilies,
} from '@/utils/canvasFormats'
import { getLanguageName } from '@/utils/locale'
import { getScopedEditingIndicator } from '@/utils/scopedEditingIndicator'
import { CreateFormatLayoutModal } from '@/components/panels/CreateFormatLayoutModal'
import { ContentSyncModal } from '@/components/panels/ContentSyncModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { HorizontalScrollAffordance, SlidingUnderline } from './EditingContextChrome'
import { useStudioLocale } from '@/i18n'

function useDismissOnOutsideClick(
  open: boolean,
  refs: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement | null>[],
  close: () => void,
) {
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const targets = Array.isArray(refs) ? refs : [refs]
      if (!targets.some((ref) => ref.current?.contains(event.target as Node))) close()
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, refs, close])
}

/** Width of the format popover; also used to clamp it inside the viewport. */
const FORMAT_MENU_WIDTH = 250

export function EditingContextBar() {
  const { t } = useStudioLocale()
  const {
    project,
    settings,
    slideGroups,
    activeSlideGroupId,
    activeCanvasFormat,
    activeFamily,
    activeLocale,
    setActiveCanvasFormat: setActiveCanvasFormatRaw,
    setActiveFamily,
    setActiveSlideGroup,
    setActiveLocale,
    addCustomFormat,
    addFormatToFamily,
    deleteFormatLayout,
    removeCustomFormat,
    resetActiveFormatLayout,
    shareActiveFormatOwnedLayers,
    resetActiveFormatVisibility,
    promoteActiveFormatLayoutToShared,
    resetActiveLocaleAdjust,
  } = useEditorStore(
    useShallow((state) => ({
      project: state.project,
      settings: state.project.settings,
      slideGroups: state.project.slideGroups,
      activeSlideGroupId: state.activeSlideGroupId,
      activeCanvasFormat: state.activeCanvasFormat,
      activeFamily: state.activeFamily,
      activeLocale: state.activeLocale,
      setActiveCanvasFormat: state.setActiveCanvasFormat,
      setActiveFamily: state.setActiveFamily,
      setActiveSlideGroup: state.setActiveSlideGroup,
      setActiveLocale: state.setActiveLocale,
      addCustomFormat: state.addCustomFormat,
      addFormatToFamily: state.addFormatToFamily,
      deleteFormatLayout: state.deleteFormatLayout,
      removeCustomFormat: state.removeCustomFormat,
      resetActiveFormatLayout: state.resetActiveFormatLayout,
      shareActiveFormatOwnedLayers: state.shareActiveFormatOwnedLayers,
      resetActiveFormatVisibility: state.resetActiveFormatVisibility,
      promoteActiveFormatLayoutToShared: state.promoteActiveFormatLayoutToShared,
      resetActiveLocaleAdjust: state.resetActiveLocaleAdjust,
    })),
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [createTarget, setCreateTarget] = useState<CanvasFormatId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BuiltInFormatId | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [contentSyncOpen, setContentSyncOpen] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  const [formatMenuPosition, setFormatMenuPosition] = useState({ left: 0, top: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileFormatRef = useRef<HTMLDivElement>(null)
  const formatMenuRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  useDismissOnOutsideClick(dropdownOpen || showCustomInput, [dropdownRef, mobileFormatRef, formatMenuRef], () => { setDropdownOpen(false); setShowCustomInput(false) })
  useDismissOnOutsideClick(actionsOpen, actionsRef, () => setActionsOpen(false))

  const baseFormat = getProjectBaseFormat({ settings })
  const activeFormats: CanvasFormatId[] = getProjectActiveFormats({ settings })
  const families = selectProjectFamilies(project)
  const hasMultipleFamilies = families.length >= 2
  const isCreated = (formatId: CanvasFormatId) => activeFormats.includes(formatId) && hasFormatLayout(project, formatId)
  const activeFamilyFormats = selectFamilyFormats(project, activeFamily)
    .filter(isCreated)
  const activeFamilyPresetFormats = activeFamilyFormats.filter((formatId): formatId is BuiltInFormatId => !isCustomFormatId(formatId))
  const activeFamilyCustomFormats = activeFamilyFormats.filter(isCustomFormatId)
  const familyEntries = families.map((family) => {
    const formats = selectFamilyFormats(project, family)
      .filter(isCreated)
    return {
      family,
      presetFormats: formats.filter((formatId): formatId is BuiltInFormatId => !isCustomFormatId(formatId)),
      customFormats: formats.filter(isCustomFormatId),
    }
  })
  const rawGroup = slideGroups.find((group) => group.id === activeSlideGroupId)
  const defaultLocale = settings.defaultLocale
  const locales = settings.locales ?? [defaultLocale]
  const hasMultipleLocales = locales.length > 1
  const isFormatScoped = activeCanvasFormat !== baseFormat
  const isLocaleScoped = activeLocale !== defaultLocale
  const hasActions = isFormatScoped || isLocaleScoped || hasMultipleFamilies
  const formatLabel = getFormatLabel(activeCanvasFormat, settings.customFormats)
  const localeLabel = getLanguageName(activeLocale)
  const formatCount = rawGroup && isFormatScoped
    ? countFormatAdjustments(rawGroup, activeCanvasFormat, baseFormat)
    : 0
  const localeCount = rawGroup && isLocaleScoped
    ? countLocaleAdjustments(rawGroup, activeLocale, activeCanvasFormat)
    : 0
  const setActiveCanvasFormat = (formatId: CanvasFormatId) => {
    const targetFamily = getFormatFamilyKey(formatId)
    if (formatId !== baseFormat && targetFamily && targetFamily !== activeFamily) {
      setActiveFamily(targetFamily)
      setActiveCanvasFormatRaw(formatId)
      return
    }
    const activeGroup = slideGroups.find((group) => group.id === activeSlideGroupId)
    if (activeGroup && !groupTargetsFormat(activeGroup, formatId)) {
      const targetGroup = slideGroups.find((group) => groupTargetsFormat(group, formatId))
      if (targetGroup) setActiveSlideGroup(targetGroup.id)
    }
    setActiveCanvasFormatRaw(formatId)
  }
  const selectFormat = setActiveCanvasFormat
  const uncreatedFormats = CANVAS_FORMAT_PRESETS
    .map((format) => format.id)
    .filter((formatId) => !isCreated(formatId))
  // `group.formats` is canonical family membership, not "currently active"
  // (a fresh fork gets every built-in preset in its family up front). What
  // actually decides whether this deletion empties the family is whether any
  // OTHER member of that family remains in `activeFormats` — mirrors the
  // `deleteFormatLayout` store action's own family-emptiness check.
  const deleteTargetFamily = deleteTarget ? (getFormatFamilyKey(deleteTarget) ?? 'phone') : null
  const deleteTargetGroups = deleteTarget && deleteTargetFamily
    ? slideGroups.filter((group) => (getGroupFamilyKey(group) ?? 'phone') === deleteTargetFamily)
    : []
  const deleteTargetFamilyStillActive = deleteTarget && deleteTargetFamily
    ? selectFamilyFormats(project, deleteTargetFamily)
      .some((format) => format !== deleteTarget && activeFormats.includes(format))
    : true
  const deleteTargetOwnsAllGroups = deleteTargetGroups.length > 0
    && !deleteTargetFamilyStillActive
    && deleteTargetGroups.length === slideGroups.length
  const deleteTargetExclusiveGroups = deleteTargetFamilyStillActive ? [] : deleteTargetGroups
  const deleteTargetLabel = deleteTarget ? getFormatLabel(deleteTarget, settings.customFormats) : ''
  const deleteTargetMessage = deleteTargetOwnsAllGroups
    ? t.context.deleteLastGroupMsg
    : deleteTargetGroups.length === 0
      ? t.context.deleteNoLayoutsMsg
    : deleteTargetExclusiveGroups.length > 0
      ? t.context.deleteExclusiveMsg
      : t.context.deleteSharedMsg

  const clearCustomForm = () => {
    setShowCustomInput(false)
    setCustomLabel('')
    setCustomW('')
    setCustomH('')
  }
  const openFormatMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect) {
      // The + button sits near the right edge on phones, so anchoring the
      // popover at rect.left pushed 206px of it past a 393px viewport. Clamp
      // the anchored left edge so the popover always fits on screen.
      const menuWidth = Math.min(FORMAT_MENU_WIDTH, window.innerWidth - 8)
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 4)
      setFormatMenuPosition({ left: Math.max(4, left), top: rect.bottom + 4 })
    }
    setDropdownOpen((open) => !open)
  }
  const runFormatAction = (action: (format: CanvasFormatId) => void) => {
    action(activeCanvasFormat)
    setActionsOpen(false)
  }
  const handlePromoteLayout = () => {
    runFormatAction(promoteActiveFormatLayoutToShared)
  }
  const handleLocaleAdjustReset = () => {
    resetActiveLocaleAdjust()
    setActionsOpen(false)
  }
  const actionItemClass = 'w-full px-3 py-2 text-left text-[11px] text-[#e8e8f0] transition-colors hover:bg-[rgba(255,255,255,0.06)]'

  // `border-b-2 border-transparent` reserves the 2px the old inline underline
  // occupied, so removing it shifts no text.  The sliding bar overlays this strip.
  const tabClass = (active: boolean) =>
    `flex h-full shrink-0 items-center gap-1 whitespace-nowrap border-b-2 border-transparent px-2.5 text-[11px] font-medium transition-colors ${
      active ? 'text-white' : `${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0]`
    }`
  // Base is deliberately rendered inside EVERY family strip: `selectFormatViewGroups`
  // scopes the base view to that family's groups, so Base is per-family in effect.
  const renderBaseTab = () => (
    <button
      onClick={() => selectFormat(baseFormat)}
      data-tab-key={baseFormat}
      className={tabClass(activeCanvasFormat === baseFormat)}
      title={t.context.baseTitle}
    >
      {t.context.base}
    </button>
  )
  const renderPresetTab = (formatId: BuiltInFormatId) => {
    const isActive = activeCanvasFormat === formatId
    const count = rawGroup ? countFormatAdjustments(rawGroup, formatId, baseFormat) : 0
    const label = getFormatLabel(formatId, settings.customFormats)
    return <div key={formatId} className="group/tab flex h-full shrink-0 items-center">
      <button onClick={() => setActiveCanvasFormat(formatId)} data-tab-key={formatId} className={tabClass(isActive)} title={`${label} format · ${count} layout adjustment${count !== 1 ? 's' : ''}`}>
        {label}{count > 0 && <span className="text-[9px] font-bold text-[#fbbf24]">●{count}</span>}
      </button>
      <div className="pointer-events-none -ml-0.5 flex h-full w-4 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 group-focus-within/tab:pointer-events-auto group-focus-within/tab:opacity-100">
        <button type="button" onClick={() => setDeleteTarget(formatId)} className={`flex h-4 w-4 items-center justify-center rounded text-xs ${STUDIO_TEXT_MUTED_CLS} transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171]`} title={`Delete ${label} layout`} aria-label={`Delete ${label} layout`}>×</button>
      </div>
    </div>
  }
  const renderCustomTab = (formatId: CustomFormatId) => (
    <div key={formatId} className="group/tab flex h-full shrink-0 items-center">
      <button onClick={() => setActiveCanvasFormat(formatId)} data-tab-key={formatId} className={tabClass(activeCanvasFormat === formatId)}>
        {getFormatLabel(formatId, settings.customFormats)}
      </button>
      <button type="button" onClick={() => removeCustomFormat(formatId)} className={`-ml-2 pr-1 text-xs ${STUDIO_TEXT_MUTED_CLS} opacity-0 transition-opacity group-hover/tab:opacity-100 group-focus-within/tab:opacity-100 focus-visible:opacity-100 hover:text-[#f87171]`} title="Remove format" aria-label="Remove format">×</button>
    </div>
  )
  const renderFormatAddButton = () => (
    <div className="relative ml-1 flex h-full shrink-0 items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={openFormatMenu}
        className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-sm ${STUDIO_TEXT_MUTED_CLS} transition-colors hover:border-[rgba(245,158,11,0.18)] hover:bg-[rgba(245,158,11,0.07)] hover:text-[#fbbf24]`}
        title={t.context.addFormatTitle}
        aria-label={t.context.addFormatTitle}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
  const renderFormatMenuFamilies = (
    formats: readonly BuiltInFormatId[],
    onSelect: (formatId: BuiltInFormatId) => void,
  ) => FORMAT_FAMILY_ORDER.map((family) => {
    const familyFormats = formats.filter((formatId) => FORMAT_FAMILY[formatId] === family)
    if (familyFormats.length === 0) return null
    return (
      <div key={family} className="pb-1.5 last:pb-0">
        <p className={`px-3 pb-1 pt-2 text-[8px] font-semibold uppercase tracking-[0.2em] ${STUDIO_TEXT_SUBTLE_CLS}`}>{FORMAT_FAMILY_LABELS[family]}</p>
        {familyFormats.map((formatId) => {
          const { width, height } = getCanvasFormat(formatId)
          return (
            <button key={formatId} onClick={() => onSelect(formatId)} className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-xs font-medium text-[#c2c2cf] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-white">
              <span>{getFormatLabel(formatId, settings.customFormats)}</span>
              <span className="shrink-0 font-normal tabular-nums text-[#656574]">{width} × {height}</span>
            </button>
          )
        })}
      </div>
    )
  })

  return (
    <div className={`relative ${actionsOpen ? 'z-40' : 'z-20'} h-11 shrink-0 border-b border-[rgba(255,255,255,0.07)] bg-[#18181f] px-3`}>
      <div className="flex h-full min-w-0 items-stretch">
        <section className="flex min-w-0 flex-1 items-stretch" aria-label={t.context.canvasFormatAria}>
          <div className="mr-1.5 hidden shrink-0 items-center gap-1.5 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_7px_rgba(245,158,11,0.35)]" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6b6254]">{t.context.format}</span>
          </div>
          <label className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
            <span className="sr-only">{t.context.canvasFormatAria}</span>
            <select
              aria-label={t.context.canvasFormatAria}
              value={activeCanvasFormat}
              onChange={(event) => selectFormat(event.target.value as CanvasFormatId)}
              className="w-full min-w-0 rounded-md border border-white/20 bg-[#222330] px-2 py-1.5 text-xs text-white"
            >
              {Array.from(new Set([baseFormat, ...familyEntries.flatMap(({ presetFormats, customFormats }) => [...presetFormats, ...customFormats])])).map((formatId) => (
                <option key={formatId} value={formatId}>
                  {formatId === baseFormat ? t.context.base : getFormatLabel(formatId, settings.customFormats)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex shrink-0 items-center lg:hidden" ref={mobileFormatRef}>
            <button type="button" onClick={openFormatMenu} title={t.context.addFormatTitle} aria-label={t.context.addFormatTitle}
              aria-expanded={dropdownOpen || showCustomInput}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-[#222330] text-base text-[#fbbf24] focus-visible:outline-2 focus-visible:outline-accent">+</button>
          </div>
          <div className="hidden min-w-0 flex-1 lg:flex">
          {hasMultipleFamilies ? (
            <HorizontalScrollAffordance>
              <div role="group" aria-label="Format family" className="flex h-full min-w-max items-stretch gap-0.5">
                {familyEntries.map(({ family, presetFormats, customFormats }) => {
                const expanded = activeFamily === family
                const memberCount = presetFormats.length + customFormats.length
                const panelId = `format-family-${family}`
                return (
                  <div
                    key={family}
                    className={`flex h-full shrink-0 items-stretch rounded-t-[5px] transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
                      expanded
                        ? 'bg-[rgba(255,255,255,0.035)] shadow-[inset_0_1px_0_rgba(245,158,11,0.14)]'
                        : 'hover:bg-[rgba(255,255,255,0.02)]'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFamily(family)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      title={
                        expanded
                          ? `${FORMAT_FAMILY_LABELS[family]} formats`
                          : `Switch to ${FORMAT_FAMILY_LABELS[family]} — ${memberCount} format${memberCount !== 1 ? 's' : ''}`
                      }
                      className={`flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-2 text-[8px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ease-out motion-reduce:transition-none ${
                        expanded
                          ? 'text-[#e0a951]' : 'text-[#5c5967] hover:text-[#a29daa]'
                      }`}
                    >
                      {FORMAT_FAMILY_LABELS[family]}
                      <span
                        aria-hidden="true"
                        className={`grid h-3.5 min-w-3.5 place-items-center rounded-[3px] px-1 text-[8px] font-bold leading-none tabular-nums transition-colors duration-200 ease-out motion-reduce:transition-none ${
                          expanded
                            ? 'bg-[rgba(245,158,11,0.10)] text-[#e0a951]'
                            : 'bg-[rgba(255,255,255,0.05)] text-[#6f6b7b]'
                        }`}
                      >
                        {memberCount}
                      </span>
                    </button>

                    {/* Level 1 — animated track. `0fr -> 1fr` resolves against the
                        tabs' real max-content width, so the full 220ms is visible
                        motion (the old max-w-[34rem] finished in ~55ms then stalled). */}
                    <div
                      id={panelId}
                      inert={!expanded}
                      className={`grid h-full transition-[grid-template-columns] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        expanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
                      }`}
                    >
                      {/* Level 2 — clipper. `min-w-0` + `overflow-hidden` are BOTH
                          required or the 0fr track will never collapse. */}
                      <div className="flex h-full min-w-0 overflow-hidden">
                        {/* Level 3 — intrinsic content + fade/slide. */}
                        <div
                          className={`relative flex h-full min-w-max items-stretch border-l transition-[opacity,translate,transform,border-color] duration-150 ease-out motion-reduce:transition-none ${
                            expanded
                              ? 'translate-x-0 border-[rgba(255,255,255,0.07)] opacity-100 delay-[50ms]'
                              : '-translate-x-1.5 border-transparent opacity-0 delay-0'
                          }`}
                        >
                          {renderBaseTab()}
                          {presetFormats.map(renderPresetTab)}
                          {customFormats.map(renderCustomTab)}
                          <SlidingUnderline
                            accentClass="bg-[#f59e0b]"
                            activeKey={activeCanvasFormat}
                            enabled={expanded}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
                })}
                {renderFormatAddButton()}
              </div>
            </HorizontalScrollAffordance>
          ) : (
            <HorizontalScrollAffordance>
              <div className="relative flex h-full min-w-max items-stretch">
                {renderBaseTab()}
                {activeFamilyPresetFormats.map(renderPresetTab)}
                {activeFamilyCustomFormats.map(renderCustomTab)}
                {renderFormatAddButton()}
                <SlidingUnderline accentClass="bg-[#f59e0b]" activeKey={activeCanvasFormat} />
              </div>
            </HorizontalScrollAffordance>
          )}

          </div>
          {(dropdownOpen || showCustomInput) && createPortal(
            <div
              ref={formatMenuRef}
              className="fixed z-50"
              style={{ left: formatMenuPosition.left, top: formatMenuPosition.top }}
            >
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[250px] max-w-[calc(100vw-8px)] max-h-[min(30rem,calc(100vh-5rem))] overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#1e1e2a] py-1 shadow-xl">
                {uncreatedFormats.length > 0 && <section aria-label={t.context.createNewLayout}>
                  <p className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#fbbf24]">{t.context.createNewLayout}</p>
                  {renderFormatMenuFamilies(uncreatedFormats, (formatId) => {
                    const family = getFormatFamilyKey(formatId) ?? 'phone'
                    if (selectFamilyGroups(project, family).length > 0) {
                      addFormatToFamily(formatId)
                      setActiveCanvasFormat(formatId)
                    } else {
                      setCreateTarget(formatId)
                    }
                    setDropdownOpen(false)
                  })}
                </section>}
                {uncreatedFormats.length > 0 && <div className="mx-2 my-1 h-px bg-[rgba(255,255,255,0.08)]" />}
                <section aria-label={t.context.addCustomCanvasSize}>
                  <p className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#b7b7c5]">{t.context.addCustomCanvasSize}</p>
                  <button
                    onClick={() => { setShowCustomInput(true); setDropdownOpen(false) }}
                    className="w-full px-3 py-1.5 text-left text-xs text-[#a0a0b0] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e8e8f0]"
                  >
                    {t.context.customSize}
                  </button>
                </section>
              </div>
            )}
            {showCustomInput && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[210px] max-w-[calc(100vw-8px)] rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#1e1e2a] p-3 shadow-xl">
                <p className={`mb-2 text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.context.customCanvasFormat}</p>
                <input
                  type="text"
                  placeholder={t.context.labelOptional}
                  value={customLabel}
                  onChange={(event) => setCustomLabel(event.target.value)}
                  className="mb-2 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[#0f0f13] px-2 py-1 text-xs text-[#e8e8f0] focus:outline-none"
                />
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="W"
                    value={customW}
                    onChange={(event) => setCustomW(event.target.value)}
                    className="w-20 rounded border border-[rgba(255,255,255,0.1)] bg-[#0f0f13] px-2 py-1 text-xs text-[#e8e8f0] [appearance:textfield] focus:outline-none"
                  />
                  <span className={`text-xs ${STUDIO_TEXT_MUTED_CLS}`}>×</span>
                  <input
                    type="number"
                    placeholder="H"
                    value={customH}
                    onChange={(event) => setCustomH(event.target.value)}
                    className="w-20 rounded border border-[rgba(255,255,255,0.1)] bg-[#0f0f13] px-2 py-1 text-xs text-[#e8e8f0] [appearance:textfield] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const width = parseInt(customW)
                      const height = parseInt(customH)
                      if (width >= 100 && width <= 9999 && height >= 100 && height <= 9999) {
                        addCustomFormat(customLabel.trim() || `${t.common.custom} ${width}×${height}`, width, height)
                      }
                      clearCustomForm()
                    }}
                    className="flex-1 rounded bg-accent-strong px-2 py-1 text-xs text-accent-fg hover:bg-accent-strong/90"
                  >
                    {t.common.apply}
                  </button>
                  <button onClick={clearCustomForm} className={`px-2 py-1 text-xs ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0]`}>{t.common.cancel}</button>
                </div>
              </div>
            )}
            </div>,
            document.body,
          )}
        </section>

        {hasMultipleLocales && (
          <section className="ml-3 flex w-fit min-w-0 max-w-[38%] shrink items-stretch border-l border-[rgba(255,255,255,0.08)] pl-3" aria-label={t.context.editingLocaleAria}>
            <div className="mr-1.5 flex shrink-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3c5] shadow-[0_0_7px_rgba(34,211,197,0.35)]" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#526d69]">{t.context.locale}</span>
            </div>
            <HorizontalScrollAffordance containerClassName="w-fit max-w-full flex-none">
              <div className="relative flex h-full min-w-max items-stretch">
                <button
                onClick={() => setActiveLocale(defaultLocale)}
                data-tab-key={defaultLocale}
                className={tabClass(activeLocale === defaultLocale)}
                title={`${t.context.default} · ${getLanguageName(defaultLocale)}`}
              >
                {t.context.default}
              </button>
                {locales.filter((locale) => locale !== defaultLocale).map((locale) => {
                const isActive = activeLocale === locale
                // `activeCanvasFormat` doubles as the `localeAdjust` scope: at
                // the Base tab it already equals BASE_CANVAS_FORMAT, so one
                // call covers both the base-scoped and format-scoped count.
                const count = rawGroup ? countLocaleAdjustments(rawGroup, locale, activeCanvasFormat) : 0
                const label = getLanguageName(locale)
                return (
                  <button
                    key={locale}
                    onClick={() => setActiveLocale(locale)}
                    data-tab-key={locale}
                    className={tabClass(isActive)}
                    title={`${label} locale · ${count} locale layout adjustment${count !== 1 ? 's' : ''}`}
                  >
                    {label}
                    {count > 0 && <span className="text-[9px] font-bold text-[#22d3c5]">●{count}</span>}
                  </button>
                )
                })}
                <SlidingUnderline accentClass="bg-[#22d3c5]" activeKey={activeLocale} />
              </div>
            </HorizontalScrollAffordance>
          </section>
        )}
        {hasActions && (
          <div className="relative ml-3 flex shrink-0 items-center border-l border-[rgba(255,255,255,0.08)] pl-3" ref={actionsRef}>
            <button
              onClick={() => setActionsOpen((open) => !open)}
              className="rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.035)] px-2 py-1 text-[10px] text-[#c9c9d4] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.07)] hover:text-white"
            >
              {t.context.actions} ▾
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#1c1c26] shadow-2xl">
                {isFormatScoped && <>
                  <div className="border-b border-[rgba(255,255,255,0.08)] px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#fbbf24]">{formatLabel} {t.context.formatActionsSuffix}</p>
                    <p className={`mt-0.5 text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{formatCount}</p>
                  </div>
                  <button className={actionItemClass} onClick={() => runFormatAction(resetActiveFormatLayout)}>
                    {t.context.resetFormatLayout}
                    <span className={`mt-0.5 block text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.context.resetFormatLayoutDesc}</span>
                  </button>
                  <button className={actionItemClass} onClick={() => runFormatAction(shareActiveFormatOwnedLayers)}>
                    {t.context.makeFormatLayersShared}
                    <span className={`mt-0.5 block text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.context.makeFormatLayersSharedDesc}</span>
                  </button>
                  <button className={actionItemClass} onClick={() => runFormatAction(resetActiveFormatVisibility)}>
                    {t.context.resetFormatVisibility}
                    <span className={`mt-0.5 block text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.context.resetFormatVisibilityDesc}</span>
                  </button>
                  <div className="h-px bg-[rgba(255,255,255,0.08)]" />
                  <button className={actionItemClass} onClick={handlePromoteLayout}>
                    {t.context.useFormatLayoutAsShared}
                    <span className="mt-0.5 block text-[10px] text-[#f59e0b]">{t.context.useFormatLayoutAsSharedDesc}</span>
                  </button>
                </>}
                {isLocaleScoped && (
                  <section className="mt-1 border-t border-[rgba(255,255,255,0.12)]" aria-label={`${formatLabel} × ${localeLabel}`}>
                    <div className="border-b border-[rgba(255,255,255,0.08)] px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#22d3c5]">{isFormatScoped ? `${formatLabel} × ${localeLabel}` : `${localeLabel} · ${t.context.base}`}</p>
                      <p className={`mt-0.5 text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{localeCount}</p>
                    </div>
                    <button className={actionItemClass} onClick={handleLocaleAdjustReset}>
                      {isFormatScoped ? t.context.resetPairingLayout : t.context.resetLocaleBaseLayout}
                      <span className="mt-0.5 block text-[10px] text-[#22d3c5]">
                        {isFormatScoped ? t.context.resetPairingLayoutDesc : t.context.resetLocaleBaseLayoutDesc}
                      </span>
                    </button>
                  </section>
                )}
                {hasMultipleFamilies && (
                  <section className={`${isFormatScoped || isLocaleScoped ? 'mt-1 border-t border-[rgba(255,255,255,0.12)]' : ''}`} aria-label={t.context.content}>
                    <div className="border-b border-[rgba(255,255,255,0.08)] px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-accent-text">{t.context.content}</p>
                    </div>
                    <button className={actionItemClass} onClick={() => { setContentSyncOpen(true); setActionsOpen(false) }}>
                      {t.context.bringContentFrom}
                      <span className={`mt-0.5 block text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.context.bringContentFromDesc}</span>
                    </button>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <CreateFormatLayoutModal key={createTarget} open={createTarget !== null} targetFormatId={createTarget} onClose={() => setCreateTarget(null)} />
      <ContentSyncModal open={contentSyncOpen} onClose={() => setContentSyncOpen(false)} />
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`${t.context.deleteLayoutConfirm}: ${deleteTargetLabel}`}
        message={deleteTargetMessage}
        confirmLabel={deleteTargetOwnsAllGroups ? t.common.close : t.context.deleteLayoutConfirm}
        danger={!deleteTargetOwnsAllGroups}
        onConfirm={() => {
          if (deleteTarget && !deleteTargetOwnsAllGroups) deleteFormatLayout(deleteTarget)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/** A transient-feeling but persistent warning over the canvas when edits are scoped. */
export function EditingContextAlert() {
  const { t } = useStudioLocale()
  const {
    project,
    activeLocale,
    activeCanvasFormat,
    setActiveLocale,
    setActiveCanvasFormat,
  } = useEditorStore(
    useShallow((state) => ({
      project: state.project,
      activeLocale: state.activeLocale,
      activeCanvasFormat: state.activeCanvasFormat,
      setActiveLocale: state.setActiveLocale,
      setActiveCanvasFormat: state.setActiveCanvasFormat,
    })),
  )

  const { baseFormat, defaultLocale, isFormatScoped, isLocaleScoped } = getScopedEditingIndicator(
    project,
    activeLocale,
    activeCanvasFormat,
  )
  if (!isFormatScoped && !isLocaleScoped) return null

  const formatLabel = getFormatLabel(activeCanvasFormat, project.settings.customFormats)
  const localeLabel = getLanguageName(activeLocale)

  return (
    <div className="flex h-9 shrink-0 items-center justify-center border-b border-[rgba(255,255,255,0.08)] bg-[#18181f] px-3">
      <div className="flex min-w-0 max-w-full items-center justify-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          {isFormatScoped && <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_7px_rgba(245,158,11,0.75)]" />}
          {isLocaleScoped && <span className="h-1.5 w-1.5 rounded-full bg-[#22d3c5] shadow-[0_0_7px_rgba(34,211,197,0.7)]" />}
        </div>
        <p className="min-w-0 truncate text-[11px] leading-4 text-[#b7b7c5]">
          <strong className="font-semibold">
            {isFormatScoped && <span className="text-[#f59e0b]">{formatLabel}</span>}
            {isFormatScoped && isLocaleScoped && <span className="mx-1 text-[#565664]">×</span>}
            {isLocaleScoped && <span className="text-[#22d3c5]">{localeLabel}</span>}
          </strong>
          <span className="mx-1.5 text-[#565664]">—</span>
          {isFormatScoped && isLocaleScoped
            ? t.context.scopedBoth
            : isFormatScoped
              ? t.context.scopedFormat
              : `${t.context.scopedLocalePrefix}${localeLabel}${t.context.scopedLocaleSuffix}`}
        </p>
        <button
          onClick={() => {
            setActiveCanvasFormat(baseFormat)
            setActiveLocale(defaultLocale)
          }}
          className="shrink-0 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.035)] px-2 py-1 text-[10px] text-[#c9c9d4] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.07)] hover:text-white"
          title={t.context.returnBaseDefaultTitle}
        >
          {t.context.returnBaseDefault}
        </button>
      </div>
    </div>
  )
}
