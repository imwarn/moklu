/**
 * [INPUT]: depends on react useState/Fragment, zustand useShallow, ModalShell, SegmentedControl, useEditorStore, canvasFormats utilities, and useStudioLocale/formatMessage/splitMessageTemplate from @/i18n
 * [OUTPUT]: exports CreateFormatLayoutModal format layout fork dialog localized across EN/ZH/JA/KO
 * [POS]: format family creation dialog launched from EditingContextBar inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Fragment, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ModalShell } from '@/components/ui/ModalShell'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useEditorStore } from '@/store'
import type { CanvasFormatId } from '@/types'
import { BASE_CANVAS_FORMAT, FORMAT_FAMILY, FORMAT_FAMILY_LABELS, getFormatLabel, getFormatScaleFactor, getProjectActiveFormats, getProjectBaseFormat, resolveForkSourceFormat, selectForkSourceCandidates, selectForkSourceGroups } from '@/utils/canvasFormats'
import { formatMessage, splitMessageTemplate, useStudioLocale } from '@/i18n'

interface CreateFormatLayoutModalProps { open: boolean; targetFormatId: CanvasFormatId | null; onClose: () => void }
export function CreateFormatLayoutModal({ open, targetFormatId, onClose }: CreateFormatLayoutModalProps) {
  const { t } = useStudioLocale()
  const cf = t.modals.createFormatLayout
  const store = useEditorStore(useShallow((state) => ({ project: state.project, activeCanvasFormat: state.activeCanvasFormat, activeSlideGroupId: state.activeSlideGroupId, createFormatLayout: state.createFormatLayout })))
  const defaultSourceFormat = targetFormatId
    ? resolveForkSourceFormat(store.project, store.activeCanvasFormat, store.activeSlideGroupId, targetFormatId)
    : BASE_CANVAS_FORMAT
  const sourceCandidates = targetFormatId ? selectForkSourceCandidates(store.project, targetFormatId) : []
  const [sourceFormat, setSourceFormat] = useState<CanvasFormatId>(defaultSourceFormat)
  const [choice, setChoice] = useState<'copy' | 'blank'>(() => {
    if (!targetFormatId) return 'copy'
    const sourceGroups = selectForkSourceGroups(store.project, defaultSourceFormat, targetFormatId)
    const smallestScaleFactor = sourceGroups.length
      ? Math.min(...sourceGroups.map((group) => getFormatScaleFactor(group, targetFormatId, getProjectBaseFormat(store.project), store.project.settings.customFormats)))
      : 1
    return smallestScaleFactor < 0.5 ? 'blank' : 'copy'
  })
  if (!targetFormatId) return null

  const targetFamily = FORMAT_FAMILY[targetFormatId as keyof typeof FORMAT_FAMILY]
  const targetFamilyLabel = t.context.familyLabels[targetFamily] ?? FORMAT_FAMILY_LABELS[targetFamily]
  const sourceGroups = selectForkSourceGroups(store.project, sourceFormat, targetFormatId)
  const pinCount = sourceGroups.filter((group) => group.formats === undefined).length
  const remainingFormats = getProjectActiveFormats(store.project)
    .filter((format) => format !== targetFormatId)
    .map((format) => getFormatLabel(format, store.project.settings.customFormats))
  const sourceLabel = sourceFormat === BASE_CANVAS_FORMAT
    ? cf.unscoped
    : getFormatLabel(sourceFormat, store.project.settings.customFormats)
  const handleCreate = () => {
    store.createFormatLayout(targetFormatId, {
      content: choice,
      sourceFormat,
    })
    onClose()
  }

  const targetSummaryText = formatMessage(
    sourceGroups.length === 1 ? cf.summaryTargetOne : cf.summaryTargetOther,
    { count: sourceGroups.length, family: targetFamilyLabel },
  )
  const sourceSummaryText = formatMessage(
    sourceGroups.length === 1 ? cf.summarySourceOne : cf.summarySourceOther,
    { count: sourceGroups.length, source: sourceLabel },
  )

  return <ModalShell open={open} onClose={onClose} title={formatMessage(cf.title, { family: targetFamilyLabel })} maxWidth="max-w-md" bodyClassName="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5" footerClassName="flex flex-wrap justify-end gap-2 border-t border-[rgba(255,255,255,0.06)] px-4 py-3.5 sm:px-5 sm:py-4 shrink-0" footer={<><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs text-[#8f90a3] hover:bg-[rgba(255,255,255,0.06)] hover:text-white">{t.common.cancel}</button><button type="button" onClick={handleCreate} disabled={sourceGroups.length === 0} className="rounded-lg bg-accent-strong px-3 py-2 text-xs font-medium text-accent-fg hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:opacity-50">{formatMessage(cf.confirm, { family: targetFamilyLabel })}</button></>}>
    <p className="text-sm leading-6 text-[#b7b7c5]">
      {splitMessageTemplate(cf.summarySentence).map((part, idx) => (
        <Fragment key={idx}>
          {part.type === 'token' && part.key === 'target' ? (
            <span className="font-medium text-[#f4f4f7]">{targetSummaryText}</span>
          ) : part.type === 'token' && part.key === 'source' ? (
            <span className="font-medium text-[#f4f4f7]">{sourceSummaryText}</span>
          ) : (
            part.type === 'text' ? part.value : ''
          )}
        </Fragment>
      ))}
    </p>
    {pinCount > 0 && (
      <p className="mt-3 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.07)] px-3 py-2 text-[11px] leading-4 text-[#d7c08b]">
        {formatMessage(pinCount === 1 ? cf.pinNoticeOne : cf.pinNoticeOther, {
          count: pinCount,
          formats: remainingFormats.join(', ') || cf.currentFormatsFallback,
        })}
      </p>
    )}
    {sourceGroups.length === 0 && <p className="mt-3 text-[11px] text-[#d7c08b]">{cf.noSourceHint}</p>}
    {sourceCandidates.length > 0 && (
      <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a]">
        {cf.copyFromLabel}
        <select value={sourceFormat} onChange={(event) => setSourceFormat(event.target.value as CanvasFormatId)} className="mt-2 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[#0f0f13] px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-[#e8e8f0] focus:outline-none">
          {sourceCandidates.map((format) => {
            const count = selectForkSourceGroups(store.project, format, targetFormatId).length
            const label = format === BASE_CANVAS_FORMAT ? cf.unscopedScreens : getFormatLabel(format, store.project.settings.customFormats)
            return (
              <option key={format} value={format}>
                {formatMessage(count === 1 ? cf.sourceOptionOne : cf.sourceOptionOther, { label, count })}
              </option>
            )
          })}
        </select>
      </label>
    )}
    <div className="mt-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b7a]">{cf.startingPointLabel}</p>
      <SegmentedControl value={choice} onChange={setChoice} options={[{ value: 'copy', label: <><span className="block font-medium">{cf.copyAndScaleTitle}</span><span className="mt-0.5 block text-[10px] opacity-70">{cf.copyAndScaleDesc}</span></> }, { value: 'blank', label: <><span className="block font-medium">{cf.startBlankTitle}</span><span className="mt-0.5 block text-[10px] opacity-70">{cf.startBlankDesc}</span></> }]} className="grid grid-cols-1 sm:grid-cols-2 gap-2" optionClassName="min-w-0 min-h-20 rounded-lg border px-3 py-2 text-left text-[11px]" activeClassName="border-accent bg-accent-soft text-white" inactiveClassName="border-[rgba(255,255,255,0.1)] text-[#a6a7b8] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)]" />
    </div>
  </ModalShell>
}
