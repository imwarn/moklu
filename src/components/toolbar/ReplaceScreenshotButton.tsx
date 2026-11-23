/**
 * [INPUT]: depends on react, useEditorStore from @/store, useAssetStore from @/store/assets, prepareScreenshotUpload, findScreenshotTarget, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ReplaceScreenshotButton toolbar action with localized labels and titles
 * [POS]: primary screenshot swap button inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef, useState } from 'react'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { prepareScreenshotUpload } from '@/utils/screenshotAssets'
import { findScreenshotTarget } from '@/utils/templateSlots'
import { useStudioLocale } from '@/i18n'

/** Replace the primary screenshot without disturbing its frame, artwork or canvas size. */
export function ReplaceScreenshotButton() {
  const { t } = useStudioLocale()
  const project = useEditorStore((s) => s.project)
  const activeSlideGroupId = useEditorStore((s) => s.activeSlideGroupId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvas = project.slideGroups.find((g) => g.id === activeSlideGroupId)
  const target = canvas ? findScreenshotTarget(canvas.layers) : undefined

  const onUpload = async (file: File | undefined) => {
    if (!file || !target || !canvas) return
    setWorking(true)
    setError(null)
    try {
      const { key, dataUrl } = await prepareScreenshotUpload(file)
      useAssetStore.getState().addAsset(key, dataUrl)
      useEditorStore.getState().updateLayerInSlideGroup(canvas.id, target.id, {
        screenshotPath: key, screenshotDataUrl: dataUrl,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.toolbar.uploadFailed)
    } finally {
      setWorking(false)
    }
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-label={t.toolbar.replaceScreenshotInputAria}
        onChange={(e) => {
          void onUpload(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!target || working}
        title={target ? t.toolbar.replaceScreenshotTitle : t.toolbar.replaceScreenshotDisabledTitle}
        aria-label={working ? t.toolbar.replaceScreenshotWorking : t.toolbar.replaceScreenshot}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/15 px-2 py-1.5 text-xs text-[#d6d6e4] hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 min-[1536px]:px-3"
      >
        <span aria-hidden="true">↺</span>
        <span className="max-[1535px]:hidden">
          {working ? t.toolbar.replaceScreenshotWorking : t.toolbar.replaceScreenshot}
        </span>
      </button>
      {error && (
        <span role="alert" title={error} className="max-w-28 truncate text-[10px] text-red-400">
          {t.toolbar.uploadFailed}
        </span>
      )}
    </span>
  )
}
