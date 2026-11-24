/**
 * [INPUT]: depends on react, useEditorStore from @/store, useAssetStore from @/store/assets, prepareScreenshotUpload, findScreenshotTarget, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ReplaceScreenshotState interface and useReplaceScreenshot hook encapsulating screenshot target resolution and upload state
 * [POS]: shared screenshot-replacement state hook inside src/components/toolbar; consumed by ReplaceScreenshotButton and Toolbar overflow menu
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState } from 'react'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { prepareScreenshotUpload } from '@/utils/screenshotAssets'
import { findScreenshotTarget } from '@/utils/templateSlots'
import { useStudioLocale } from '@/i18n'

export interface ReplaceScreenshotState {
  working: boolean
  error: string | null
  disabled: boolean
  label: string
  title: string
  onUpload: (file: File | undefined) => Promise<void>
}

export function useReplaceScreenshot(): ReplaceScreenshotState {
  const { t } = useStudioLocale()
  const project = useEditorStore((s) => s.project)
  const activeSlideGroupId = useEditorStore((s) => s.activeSlideGroupId)
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
        screenshotPath: key,
        screenshotDataUrl: dataUrl,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.toolbar.uploadFailed)
    } finally {
      setWorking(false)
    }
  }

  return {
    working,
    error,
    disabled: !target || working,
    label: working ? t.toolbar.replaceScreenshotWorking : t.toolbar.replaceScreenshot,
    title: target ? t.toolbar.replaceScreenshotTitle : t.toolbar.replaceScreenshotDisabledTitle,
    onUpload,
  }
}
