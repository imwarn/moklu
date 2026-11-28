/**
 * [INPUT]: depends on react, isHeicFile from @/tools, findIdPhotoSpec/getOrderedIdPhotoSpecs/mmToPixels from @/tools/idPhotoSpecs, trackFunnelEvent from @/utils/telemetry, canvasUtils from ../canvasUtils, draftStorage from ../draftStorage, ExifPrivacyBanner from ../ExifPrivacyBanner, getWorkspaceStrings from ../i18n, useDebouncedValue from ../useDebouncedValue, useToolDraft from ../useToolDraft, IdPhotoControlsSidebar, IdPhotoPreviewStage, and types from ../types
 * [OUTPUT]: exports IdPhotoQuickTool component orchestrating local AI/pure-backdrop portrait matting with zero re-inference caching, debounced compositing, 4-color compare & Trio ZIP, 6-inch/A4 300 DPI print sheets, IndexedDB draft persistence, clipboard copy, and 2-layer Studio handoff
 * [POS]: 8th flagship QuickWorkspace tool panel inside src/workspace/tools; delegates matting, compositing, trio ZIP, and sheet synthesis to injected WorkspaceEngines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isHeicFile } from '@/tools'
import { findIdPhotoSpec, getOrderedIdPhotoSpecs, mmToPixels } from '@/tools/idPhotoSpecs'
import { trackFunnelEvent } from '@/utils/telemetry'
import {
  createDemoPortraitInput,
  readFileAsImageInput,
  stripExtension,
  triggerBlobDownload,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { ExifPrivacyBanner } from '../ExifPrivacyBanner'
import { getWorkspaceStrings } from '../i18n'
import type {
  WorkspaceIdPhotoFormat,
  WorkspaceIdPhotoMatteHandle,
  WorkspaceIdPhotoMattingMode,
  WorkspaceIdPhotoMattingStage,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceIdPhotoSheetOutput,
  WorkspaceIdPhotoSheetPaper,
  WorkspaceIdPhotoTab,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
} from '../types'
import { useDebouncedValue } from '../useDebouncedValue'
import { useToolDraft } from '../useToolDraft'
import { ID_PHOTO_COMPARE_COLORS } from '../locales/idPhotoLocale'
import { ID_PHOTO_CUSTOM_PRESET_ID, IdPhotoControlsSidebar } from './IdPhotoControlsSidebar'
import { IdPhotoPreviewStage } from './IdPhotoPreviewStage'

interface IdPhotoDraftSettings {
  presetId: string
  customUnit: 'mm' | 'px'
  customWidthMm: number
  customHeightMm: number
  customWidthPx: number
  customHeightPx: number
  background: string
  mattingMode: WorkspaceIdPhotoMattingMode
  edgeShift: number
  edgeFeather: number
  format: WorkspaceIdPhotoFormat
  targetSizeKb: number
  sheetPaper: WorkspaceIdPhotoSheetPaper
  cropMarks: boolean
}

function clampCropCenter(value: number): number {
  return Math.max(0.1, Math.min(0.9, value))
}

function clampZoom(value: number): number {
  return Math.max(0.7, Math.min(2.0, Math.round(value * 100) / 100))
}

export function IdPhotoQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const ip = s.idPhoto

  const orderedSpecs = useMemo(() => getOrderedIdPhotoSpecs(locale), [locale])
  const initialSpec = useMemo(() => {
    if (preset.idPhotoPreset) {
      const matched = findIdPhotoSpec(preset.idPhotoPreset)
      if (matched) return matched
    }
    return orderedSpecs[0]
  }, [orderedSpecs, preset.idPhotoPreset])

  const [image, setImage] = useState<WorkspaceImageInput | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceIdPhotoTab>(preset.idPhotoTab ?? 'single')
  const [presetId, setPresetId] = useState<string>(initialSpec?.id ?? 'cn-1inch')
  const [customUnit, setCustomUnit] = useState<'mm' | 'px'>('mm')
  const [customWidthMm, setCustomWidthMm] = useState<number>(35)
  const [customHeightMm, setCustomHeightMm] = useState<number>(45)
  const [customWidthPx, setCustomWidthPx] = useState<number>(413)
  const [customHeightPx, setCustomHeightPx] = useState<number>(531)
  const [background, setBackground] = useState<string>(
    preset.idPhotoBg ?? initialSpec?.recommendedBg ?? '#FFFFFF',
  )
  const [mattingMode, setMattingMode] = useState<WorkspaceIdPhotoMattingMode>('ai')
  const [edgeShift, setEdgeShift] = useState<number>(-0.3)
  const [edgeFeather, setEdgeFeather] = useState<number>(0.6)
  const [crop, setCrop] = useState<{ centerX: number; centerY: number; zoom: number }>({
    centerX: 0.5,
    centerY: 0.44,
    zoom: 1,
  })
  const [showGuides, setShowGuides] = useState<boolean>(true)
  const [format, setFormat] = useState<WorkspaceIdPhotoFormat>('image/jpeg')
  const [targetSizeKb, setTargetSizeKb] = useState<number>(initialSpec?.recommendedMaxKb ?? 0)
  const [sheetPaper, setSheetPaper] = useState<WorkspaceIdPhotoSheetPaper>('4r-6inch')
  const [cropMarks, setCropMarks] = useState<boolean>(true)

  const [matte, setMatte] = useState<WorkspaceIdPhotoMatteHandle | null>(null)
  const [mattingStage, setMattingStage] = useState<WorkspaceIdPhotoMattingStage | null>(null)
  const [mattingProgress, setMattingProgress] = useState<number>(0)
  const [renderedPhoto, setRenderedPhoto] = useState<WorkspaceIdPhotoRenderOutput | null>(null)
  const [comparePreviews, setComparePreviews] = useState<Record<string, WorkspaceIdPhotoRenderOutput | undefined>>({})
  const [sheetOutput, setSheetOutput] = useState<WorkspaceIdPhotoSheetOutput | null>(null)

  const [heicDecoding, setHeicDecoding] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [sheetBusy, setSheetBusy] = useState(false)
  const [sheetPdfBusy, setSheetPdfBusy] = useState(false)
  const [trioZipBusy, setTrioZipBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSpec = useMemo(
    () => (presetId === ID_PHOTO_CUSTOM_PRESET_ID ? null : (findIdPhotoSpec(presetId) ?? orderedSpecs[0] ?? null)),
    [presetId, orderedSpecs],
  )

  const targetWidthPx = useMemo(() => {
    if (activeSpec) return activeSpec.widthPx
    return customUnit === 'mm'
      ? Math.max(80, Math.min(2400, mmToPixels(customWidthMm, 300)))
      : Math.max(80, Math.min(2400, Math.round(customWidthPx)))
  }, [activeSpec, customUnit, customWidthMm, customWidthPx])

  const targetHeightPx = useMemo(() => {
    if (activeSpec) return activeSpec.heightPx
    return customUnit === 'mm'
      ? Math.max(80, Math.min(2400, mmToPixels(customHeightMm, 300)))
      : Math.max(80, Math.min(2400, Math.round(customHeightPx)))
  }, [activeSpec, customUnit, customHeightMm, customHeightPx])

  const displayMm = useMemo(() => {
    if (activeSpec) return `${activeSpec.widthMm} × ${activeSpec.heightMm} mm`
    if (customUnit === 'mm') return `${customWidthMm} × ${customHeightMm} mm`
    return `~${Math.round((targetWidthPx / 300) * 25.4)} × ${Math.round((targetHeightPx / 300) * 25.4)} mm`
  }, [activeSpec, customUnit, customWidthMm, customHeightMm, targetWidthPx, targetHeightPx])

  const filenameStem = useMemo(() => {
    const base = image ? stripExtension(image.name) : 'id-photo'
    const suffix = activeSpec ? activeSpec.id : `${targetWidthPx}x${targetHeightPx}`
    return `${base || 'id-photo'}-${suffix}`
  }, [image, activeSpec, targetWidthPx, targetHeightPx])

  const draftImages = useMemo(() => (image ? [image] : []), [image])
  const draftSettings = useMemo<IdPhotoDraftSettings>(
    () => ({
      presetId, customUnit, customWidthMm, customHeightMm, customWidthPx, customHeightPx,
      background, mattingMode, edgeShift, edgeFeather, format, targetSizeKb, sheetPaper, cropMarks,
    }),
    [
      presetId, customUnit, customWidthMm, customHeightMm, customWidthPx, customHeightPx,
      background, mattingMode, edgeShift, edgeFeather, format, targetSizeKb, sheetPaper, cropMarks,
    ],
  )

  const handleRestoreDraft = useCallback((draft: WorkspaceToolDraft<IdPhotoDraftSettings>) => {
    const restored = deserializeDraftImages(draft.images)
    if (restored[0]) setImage(restored[0])
    const cfg = draft.settings
    if (typeof cfg.presetId === 'string' && cfg.presetId) setPresetId(cfg.presetId)
    if (cfg.customUnit === 'mm' || cfg.customUnit === 'px') setCustomUnit(cfg.customUnit)
    if (typeof cfg.customWidthMm === 'number' && Number.isFinite(cfg.customWidthMm)) setCustomWidthMm(cfg.customWidthMm)
    if (typeof cfg.customHeightMm === 'number' && Number.isFinite(cfg.customHeightMm)) setCustomHeightMm(cfg.customHeightMm)
    if (typeof cfg.customWidthPx === 'number' && Number.isFinite(cfg.customWidthPx)) setCustomWidthPx(cfg.customWidthPx)
    if (typeof cfg.customHeightPx === 'number' && Number.isFinite(cfg.customHeightPx)) setCustomHeightPx(cfg.customHeightPx)
    if (typeof cfg.background === 'string' && cfg.background) setBackground(cfg.background)
    if (cfg.mattingMode === 'ai' || cfg.mattingMode === 'pure-backdrop') setMattingMode(cfg.mattingMode)
    if (typeof cfg.edgeShift === 'number' && Number.isFinite(cfg.edgeShift)) setEdgeShift(cfg.edgeShift)
    if (typeof cfg.edgeFeather === 'number' && Number.isFinite(cfg.edgeFeather)) setEdgeFeather(cfg.edgeFeather)
    if (cfg.format === 'image/jpeg' || cfg.format === 'image/png') setFormat(cfg.format)
    if (typeof cfg.targetSizeKb === 'number' && Number.isFinite(cfg.targetSizeKb)) setTargetSizeKb(cfg.targetSizeKb)
    if (cfg.sheetPaper === '4r-6inch' || cfg.sheetPaper === 'a4') setSheetPaper(cfg.sheetPaper)
    if (typeof cfg.cropMarks === 'boolean') setCropMarks(cfg.cropMarks)
  }, [])

  const { hasDraft, clearDraft } = useToolDraft<IdPhotoDraftSettings>({
    toolId: 'id-photo',
    images: draftImages,
    settings: draftSettings,
    onRestore: handleRestoreDraft,
  })

  const handleClearDraft = () => {
    setImage(null); setMatte(null); setRenderedPhoto(null); setComparePreviews({}); setSheetOutput(null)
    void clearDraft()
  }

  const handleSelectPreset = (nextId: string) => {
    setPresetId(nextId)
    if (nextId === ID_PHOTO_CUSTOM_PRESET_ID) return
    const spec = findIdPhotoSpec(nextId)
    if (!spec) return
    setBackground(spec.recommendedBg)
    if (spec.recommendedMaxKb && spec.recommendedMaxKb > 0) {
      setTargetSizeKb(spec.recommendedMaxKb)
      setFormat('image/jpeg')
    } else {
      setTargetSizeKb(0)
    }
  }

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      setError(null)
      if (isHeicFile(file)) setHeicDecoding(true)
      try {
        setImage(
          await readFileAsImageInput(file, 'portrait.jpg', {
            onHeicStage: (stage) => setHeicDecoding(stage !== 'done'),
          }),
        )
      } catch {
        setError(s.common.decodeError)
      } finally {
        setHeicDecoding(false)
      }
    },
    [s.common.decodeError],
  )

  const handleTryDemo = useCallback(() => {
    setError(null)
    setImage(createDemoPortraitInput('demo-portrait.svg'))
  }, [])

  // Step 1: Zero re-inference caching (only runs when source image or matting mode changes).
  useEffect(() => {
    if (!image) return
    let cancelled = false
    const runMatting = async () => {
      setError(null)
      setMattingStage(mattingMode === 'ai' ? 'inferring' : 'refining')
      setMattingProgress(0.15)
      try {
        const nextMatte = await engines.idPhotoMatte(image, {
          mode: mattingMode,
          onProgress: (stage, progress) => {
            if (!cancelled) { setMattingStage(stage); setMattingProgress(progress) }
          },
        })
        if (cancelled) return
        setMatte(nextMatte)
        setCrop({
          centerX: clampCropCenter(nextMatte.framing.centerX),
          centerY: clampCropCenter(nextMatte.framing.centerY),
          zoom: clampZoom(nextMatte.framing.zoom),
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : ip.mattingError)
      } finally {
        if (!cancelled) { setMattingStage(null); setMattingProgress(0) }
      }
    }
    void runMatting()
    return () => { cancelled = true }
  }, [image, mattingMode, engines, ip.mattingError])

  const activeMatte = image ? matte : null
  const activeRenderedPhoto = image ? renderedPhoto : null
  const activeComparePreviews = useMemo(() => (image ? comparePreviews : {}), [image, comparePreviews])
  const activeSheetOutput = image ? sheetOutput : null
  const activeMattingStage = image ? mattingStage : null
  const activeMattingProgress = image ? mattingProgress : 0

  const debouncedCrop = useDebouncedValue(crop, 80)
  const debouncedEdgeShift = useDebouncedValue(edgeShift, 80)
  const debouncedEdgeFeather = useDebouncedValue(edgeFeather, 80)
  const debouncedTargetWidth = useDebouncedValue(targetWidthPx, 80)
  const debouncedTargetHeight = useDebouncedValue(targetHeightPx, 80)

  // Step 2: Fast debounced re-composite over the cached portrait matte.
  useEffect(() => {
    if (!activeMatte) return
    let cancelled = false
    const runRender = async () => {
      setRendering(true)
      setError(null)
      try {
        const output = await engines.idPhotoRender(activeMatte, {
          widthPx: debouncedTargetWidth,
          heightPx: debouncedTargetHeight,
          background,
          crop: debouncedCrop,
          edgeShift: debouncedEdgeShift,
          edgeFeather: debouncedEdgeFeather,
          decontaminate: 0.88,
          format: targetSizeKb > 0 ? 'image/jpeg' : format,
          quality: 0.92,
          targetSizeKb: targetSizeKb > 0 ? targetSizeKb : undefined,
          includeForegroundPng: true,
          filenameStem,
        })
        if (!cancelled) setRenderedPhoto(output)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : ip.renderError)
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    void runRender()
    return () => {
      cancelled = true
    }
  }, [
    activeMatte, debouncedTargetWidth, debouncedTargetHeight, background, debouncedCrop,
    debouncedEdgeShift, debouncedEdgeFeather, format, targetSizeKb, filenameStem, engines, ip.renderError,
  ])

  // Step 3: Render 2x2 Multi-Color Compare previews only when the Trio tab is active.
  useEffect(() => {
    if (!activeMatte || activeTab !== 'trio') return
    let cancelled = false
    const runCompare = async () => {
      const entries = await Promise.all(
        ID_PHOTO_COMPARE_COLORS.map(async (item) => {
          try {
            const out = await engines.idPhotoRender(activeMatte, {
              widthPx: debouncedTargetWidth,
              heightPx: debouncedTargetHeight,
              background: item.hex,
              crop: debouncedCrop,
              edgeShift: debouncedEdgeShift,
              edgeFeather: debouncedEdgeFeather,
              decontaminate: 0.88,
              format: 'image/jpeg',
              quality: 0.88,
              filenameStem: `${filenameStem}-${item.id}`,
            })
            return [item.hex, out] as const
          } catch {
            return [item.hex, undefined] as const
          }
        }),
      )
      if (!cancelled) setComparePreviews(Object.fromEntries(entries))
    }
    void runCompare()
    return () => {
      cancelled = true
    }
  }, [
    activeMatte, activeTab, debouncedTargetWidth, debouncedTargetHeight,
    debouncedCrop, debouncedEdgeShift, debouncedEdgeFeather, filenameStem, engines,
  ])

  // Step 4: Render 300 DPI print sheet preview only when the Print Sheet tab is active.
  useEffect(() => {
    if (!activeRenderedPhoto || activeTab !== 'sheet') return
    let cancelled = false
    const runSheet = async () => {
      setSheetBusy(true)
      try {
        const nextSheet = await engines.idPhotoSheet({
          photoDataUrl: activeRenderedPhoto.dataUrl,
          photoWidthPx: activeRenderedPhoto.width,
          photoHeightPx: activeRenderedPhoto.height,
          paper: sheetPaper,
          dpi: 300,
          cropMarks,
          format: 'image/png',
          filenameStem: `${filenameStem}-sheet`,
        })
        if (!cancelled) setSheetOutput(nextSheet)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : ip.sheetError)
      } finally {
        if (!cancelled) setSheetBusy(false)
      }
    }
    void runSheet()
    return () => {
      cancelled = true
    }
  }, [activeRenderedPhoto, activeTab, sheetPaper, cropMarks, filenameStem, engines, ip.sheetError])

  const handlePanDelta = useCallback((deltaX: number, deltaY: number) => {
    setCrop((prev) => ({
      ...prev,
      centerX: clampCropCenter(prev.centerX + deltaX / prev.zoom),
      centerY: clampCropCenter(prev.centerY + deltaY / prev.zoom),
    }))
  }, [])

  const handleAutoCenter = useCallback(() => {
    if (!activeMatte) {
      setCrop({ centerX: 0.5, centerY: 0.44, zoom: 1 })
      return
    }
    setCrop({
      centerX: clampCropCenter(activeMatte.framing.centerX),
      centerY: clampCropCenter(activeMatte.framing.centerY),
      zoom: clampZoom(activeMatte.framing.zoom),
    })
  }, [activeMatte])

  const handleDownloadTrioZip = useCallback(async () => {
    if (!activeMatte) return
    setTrioZipBusy(true)
    setError(null)
    try {
      const trio = await engines.idPhotoTrioZip(activeMatte, {
        widthPx: targetWidthPx,
        heightPx: targetHeightPx,
        crop,
        edgeShift,
        edgeFeather,
        decontaminate: 0.88,
        format: targetSizeKb > 0 ? 'image/jpeg' : format,
        quality: 0.92,
        targetSizeKb: targetSizeKb > 0 ? targetSizeKb : undefined,
        filenameStem,
      })
      triggerBlobDownload(trio.zipBlob, `${filenameStem}-white-blue-red.zip`)
      trackFunnelEvent('export_completed', { tool: 'id-photo', variant: 'trio-zip' })
    } catch {
      setError(s.common.zipError)
    } finally {
      setTrioZipBusy(false)
    }
  }, [activeMatte, engines, targetWidthPx, targetHeightPx, crop, edgeShift, edgeFeather, targetSizeKb, format, filenameStem, s.common.zipError])

  const handleDownloadSheetPdf = useCallback(async () => {
    if (!activeRenderedPhoto) return
    setSheetPdfBusy(true)
    setError(null)
    try {
      const pdfSheet = await engines.idPhotoSheet({
        photoDataUrl: activeRenderedPhoto.dataUrl,
        photoWidthPx: activeRenderedPhoto.width,
        photoHeightPx: activeRenderedPhoto.height,
        paper: sheetPaper,
        dpi: 300,
        cropMarks,
        format: 'application/pdf',
        filenameStem: `${filenameStem}-sheet`,
      })
      triggerBlobDownload(pdfSheet.blob, pdfSheet.filename)
      trackFunnelEvent('export_completed', { tool: 'id-photo', variant: `sheet-${sheetPaper}-pdf` })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : ip.sheetError)
    } finally {
      setSheetPdfBusy(false)
    }
  }, [activeRenderedPhoto, engines, sheetPaper, cropMarks, filenameStem, ip.sheetError])

  const handleOpenInStudio = useCallback(() => {
    if (!activeRenderedPhoto) return
    const studioBg = background.startsWith('#') ? background : '#ffffff'
    if (activeRenderedPhoto.foregroundDataUrl) {
      const layer = {
        dataUrl: activeRenderedPhoto.foregroundDataUrl,
        name: `${filenameStem}-cutout.png`,
        width: activeRenderedPhoto.width,
        height: activeRenderedPhoto.height,
      }
      onOpenInStudio({
        mode: 'layers',
        slideWidth: activeRenderedPhoto.width,
        slideHeight: activeRenderedPhoto.height,
        background: studioBg,
        images: [layer],
        layers: [{ ...layer, x: 0, y: 0 }],
      })
      return
    }
    onOpenInStudio({
      mode: 'canvas',
      slideWidth: activeRenderedPhoto.width,
      slideHeight: activeRenderedPhoto.height,
      background: studioBg,
      images: [{ dataUrl: activeRenderedPhoto.dataUrl, name: activeRenderedPhoto.filename, width: activeRenderedPhoto.width, height: activeRenderedPhoto.height }],
    })
  }, [activeRenderedPhoto, onOpenInStudio, background, filenameStem])

  const getCopyTarget = useCallback(
    async () => (activeRenderedPhoto ? { blob: activeRenderedPhoto.blob, previewDataUrl: activeRenderedPhoto.dataUrl } : null),
    [activeRenderedPhoto],
  )

  const isBusy = Boolean(activeMattingStage) || rendering

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-7">
        <IdPhotoPreviewStage
          theme={theme}
          locale={locale}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasImage={Boolean(image)}
          isBusy={isBusy}
          heicDecoding={heicDecoding}
          mattingStage={activeMattingStage}
          mattingProgress={activeMattingProgress}
          renderedPhoto={activeRenderedPhoto}
          comparePreviews={activeComparePreviews}
          activeBackground={background}
          targetWidthPx={targetWidthPx}
          targetHeightPx={targetHeightPx}
          targetSizeKb={targetSizeKb}
          showGuides={showGuides}
          onToggleGuides={setShowGuides}
          onPanDelta={handlePanDelta}
          onAutoCenter={handleAutoCenter}
          onSelectBackground={setBackground}
          onDownloadTrioZip={() => void handleDownloadTrioZip()}
          trioZipBusy={trioZipBusy}
          sheetPaper={sheetPaper}
          onSheetPaperChange={setSheetPaper}
          cropMarks={cropMarks}
          onCropMarksChange={setCropMarks}
          sheetOutput={activeSheetOutput}
          sheetBusy={sheetBusy}
          sheetPdfBusy={sheetPdfBusy}
          onDownloadSheetPng={() => {
            if (!activeSheetOutput) return
            triggerBlobDownload(activeSheetOutput.blob, activeSheetOutput.filename)
            trackFunnelEvent('export_completed', { tool: 'id-photo', variant: `sheet-${sheetPaper}-png` })
          }}
          onDownloadSheetPdf={() => void handleDownloadSheetPdf()}
          onFiles={(files) => void handleFiles(files)}
          onTryDemo={handleTryDemo}
          hasDraft={hasDraft}
          onClearDraft={handleClearDraft}
        />
        <ExifPrivacyBanner theme={theme} locale={locale} images={draftImages} />
      </div>

      <IdPhotoControlsSidebar
        theme={theme}
        locale={locale}
        hasImage={Boolean(image)}
        hasMatte={Boolean(activeMatte)}
        isBusy={isBusy}
        trioZipBusy={trioZipBusy}
        orderedSpecs={orderedSpecs}
        activeSpec={activeSpec}
        presetId={presetId}
        onSelectPreset={handleSelectPreset}
        customUnit={customUnit}
        onCustomUnitChange={setCustomUnit}
        customWidthMm={customWidthMm}
        customHeightMm={customHeightMm}
        customWidthPx={customWidthPx}
        customHeightPx={customHeightPx}
        onCustomWidthMmChange={setCustomWidthMm}
        onCustomHeightMmChange={setCustomHeightMm}
        onCustomWidthPxChange={setCustomWidthPx}
        onCustomHeightPxChange={setCustomHeightPx}
        displayMm={displayMm}
        targetWidthPx={targetWidthPx}
        targetHeightPx={targetHeightPx}
        background={background}
        onBackgroundChange={setBackground}
        mattingMode={mattingMode}
        onMattingModeChange={setMattingMode}
        edgeShift={edgeShift}
        onEdgeShiftChange={setEdgeShift}
        edgeFeather={edgeFeather}
        onEdgeFeatherChange={setEdgeFeather}
        zoom={crop.zoom}
        onZoomChange={(zoom) => setCrop((prev) => ({ ...prev, zoom }))}
        format={format}
        onFormatChange={setFormat}
        targetSizeKb={targetSizeKb}
        onTargetSizeKbChange={setTargetSizeKb}
        renderedPhoto={activeRenderedPhoto}
        error={error}
        onError={setError}
        onFiles={(files) => void handleFiles(files)}
        onTryDemo={handleTryDemo}
        onDownloadPhoto={() => {
          if (!activeRenderedPhoto) return
          triggerBlobDownload(activeRenderedPhoto.blob, activeRenderedPhoto.filename)
          trackFunnelEvent('export_completed', { tool: 'id-photo', preset: presetId })
        }}
        onDownloadTrioZip={() => void handleDownloadTrioZip()}
        getCopyTarget={getCopyTarget}
        onOpenInStudio={handleOpenInStudio}
      />
    </div>
  )
}
