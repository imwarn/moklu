/**
 * [INPUT]: depends on type contracts from @/tools/types and ./types, plus on-demand dynamic imports of @/tools/canvasHelpers, @/tools/mergeEngine, @/tools/splitEngine, @/tools/compressEngine, @/tools/transformEngine, @/tools/idCardEngine, @/tools/portraitMatting, and @/tools/idPhotoEngine
 * [OUTPUT]: exports parseBackgroundFill, formatSuffixedFilename, and createToolsWorkspaceEngines lazily adapting src/tools pure canvas and portrait matting engines (including seam overrides, multipage PDF, target-KB compression, ID photo matting/trio/sheets, and EXIF/original metadata passthrough) to the WorkspaceEngines DIP contract with guaranteed LoadedImageItem disposal
 * [POS]: concrete lazy integration adapter inside src/workspace; keeps pure canvas and ONNX matting engines out of initial landing JS while bridging UI panels in src/workspace/tools to src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  AspectPreset,
  BackgroundFill,
  GradientStop,
  ImageFormat,
  LoadedImageItem,
  PortraitMatteData,
} from '@/tools/types'
import type {
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceCompressItem,
  WorkspaceCompressOptions,
  WorkspaceEngines,
  WorkspaceIdCardOptions,
  WorkspaceIdPhotoMatteHandle,
  WorkspaceIdPhotoMatteOptions,
  WorkspaceIdPhotoRenderOptions,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceIdPhotoSheetOptions,
  WorkspaceIdPhotoSheetOutput,
  WorkspaceIdPhotoTrioResult,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceMergeLayout,
  WorkspaceMergeOptions,
  WorkspaceMergeOutput,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceTransformOptions,
} from './types'

const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function extensionForFormat(format: ImageFormat): string {
  return FORMAT_EXTENSIONS[format]
}

function sanitizeFilenameStem(name: string, fallback = 'image'): string {
  const stripped = name.replace(/\.[^./\\]+$/, '')
  const cleaned = stripped
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
  return cleaned || fallback
}

function resolveEncodedImageFormat(requested: ImageFormat, blob: Blob): ImageFormat {
  if (blob.type === 'image/jpeg' || blob.type === 'image/webp' || blob.type === 'image/png') {
    return blob.type
  }
  return requested
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to encode blob as data URL.'))
      }
    }
    reader.onerror = () => reject(new Error('FileReader failed while reading canvas blob.'))
    reader.readAsDataURL(blob)
  })
}

async function loadImageLifecycle() {
  if (import.meta.env.MODE === 'test') {
    const tools = await import('@/tools')
    return {
      loadImageItem: tools.loadImageItem,
      disposeImageItems: tools.disposeImageItems,
    }
  }
  const helpers = await import('@/tools/canvasHelpers')
  return {
    loadImageItem: helpers.loadImageItem,
    disposeImageItems: helpers.disposeImageItems,
  }
}

async function withLoadedImages<T>(
  inputs: readonly WorkspaceImageInput[],
  fn: (loaded: LoadedImageItem[]) => Promise<T>,
): Promise<T> {
  const { loadImageItem, disposeImageItems } = await loadImageLifecycle()
  const loaded: LoadedImageItem[] = []
  try {
    for (const input of inputs) {
      const item = await loadImageItem(input.file ?? input.dataUrl, { name: input.name })
      if (input.sizeBytes > 0) {
        item.originalBytes = input.sizeBytes
      }
      loaded.push(item)
    }
    return await fn(loaded)
  } finally {
    disposeImageItems(loaded)
  }
}

/**
 * Converts CSS linear-gradient(...) strings used by workspace swatches into
 * the structured LinearGradientFill accepted by src/tools canvas helpers.
 */
export function parseBackgroundFill(background: string): BackgroundFill {
  const trimmed = background.trim()
  if (!trimmed.toLowerCase().startsWith('linear-gradient(') || !trimmed.endsWith(')')) {
    return trimmed
  }

  const inner = trimmed.slice('linear-gradient('.length, -1)
  const parts = inner
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  let angle = 135
  let colorTokens = parts
  if (parts.length > 0 && /deg$/i.test(parts[0])) {
    const parsedAngle = Number.parseFloat(parts[0])
    if (Number.isFinite(parsedAngle)) {
      angle = parsedAngle
      colorTokens = parts.slice(1)
    }
  }

  if (colorTokens.length < 2) {
    return colorTokens[0] ?? '#ffffff'
  }

  const stops: GradientStop[] = colorTokens.map((token, idx) => {
    const percentMatch = /^(.*?)\s+(\d+(?:\.\d+)?)%$/.exec(token)
    if (percentMatch) {
      return {
        color: percentMatch[1].trim(),
        offset: Number.parseFloat(percentMatch[2]) / 100,
      }
    }
    return {
      color: token,
      offset: idx / Math.max(1, colorTokens.length - 1),
    }
  })

  return { type: 'linear', angle, stops }
}

function mapAspectPreset(aspect: WorkspaceAspectPreset): Exclude<AspectPreset, 'original'> | undefined {
  if (aspect === 'free') return undefined
  return aspect
}

/**
 * Formats an output filename by sanitizing the original stem (with a safe non-empty
 * fallback stem), appending an optional suffix, and applying the format extension.
 */
export function formatSuffixedFilename(
  originalName: string,
  suffix: string,
  format: WorkspaceImageFormat,
  fallbackStem = 'image',
): string {
  const stem = sanitizeFilenameStem(originalName, fallbackStem)
  const cleanSuffix = suffix.replace(/^-+/, '')
  const finalStem = cleanSuffix ? `${stem}-${cleanSuffix}` : stem
  return `${finalStem}.${extensionForFormat(format)}`
}

async function toBlobOutput(
  blob: Blob,
  width: number,
  height: number,
  filename: string,
  mimeType: string,
  options?: { previewBlob?: Blob; scaleFactor?: number },
): Promise<WorkspaceBlobOutput> {
  const dataUrl = await blobToDataUrl(options?.previewBlob ?? blob)
  return {
    blob,
    dataUrl,
    width,
    height,
    filename,
    sizeBytes: blob.size,
    mimeType,
    ...(options?.scaleFactor !== undefined ? { scaleFactor: options.scaleFactor } : {}),
  }
}

export function createToolsWorkspaceEngines(): WorkspaceEngines {
  return {
    async merge(images: WorkspaceImageInput[], options: WorkspaceMergeOptions): Promise<WorkspaceMergeOutput> {
      const mergeImages =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).mergeImages
          : (await import('@/tools/mergeEngine')).mergeImages

      return withLoadedImages(images, async (loaded) => {
        const ext = options.format === 'application/pdf' ? 'pdf' : extensionForFormat(options.format)
        const result = await mergeImages(loaded, {
          mode: options.direction,
          normalize: options.normalize,
          align: options.align,
          columns: options.columns,
          aspectCell: options.aspectCell,
          fit: options.fit,
          gap: options.gap,
          padding: options.padding,
          borderRadius: options.borderRadius,
          borderWidth: options.borderWidth,
          borderColor: options.borderColor,
          itemRotations: images.map((img) => img.rotation ?? 0),
          background: parseBackgroundFill(options.background),
          format: options.format,
          quality: options.quality,
          removeOverlap: options.removeOverlap,
          seamOverlapOverrides: options.seamOverlapOverrides,
          pdfMode: options.pdfMode,
          pdfPageSize: options.pdfPageSize,
          pdfOrientation: options.pdfOrientation,
          pdfMargin: options.pdfMargin,
          filename: `moklu-merged.${ext}`,
        })
        const base = await toBlobOutput(result.blob, result.width, result.height, result.filename, result.format, {
          previewBlob: result.previewBlob,
          scaleFactor: result.layout.scaleFactor,
        })
        const rawSeams = result.layout.seams ?? result.seams
        const seams = rawSeams?.map((seam) => ({
          index: seam.index,
          autoOverlapPx: seam.autoOverlapPx,
          appliedOverlapPx: seam.appliedOverlapPx,
          fixedTopPx: seam.fixedTopPx,
          fixedBottomPx: seam.fixedBottomPx,
        }))
        const layout: WorkspaceMergeLayout = {
          width: result.layout.width,
          height: result.layout.height,
          scaleFactor: result.layout.scaleFactor,
          overlapRemovedPx: result.layout.overlapRemovedPx ?? 0,
          ...(seams ? { seams } : {}),
          placements: result.layout.placements.map((p) => ({
            index: p.index,
            sourceRect: { ...p.sourceRect },
            destRect: { ...p.destRect },
            radius: p.radius,
            rotation: p.rotation,
            borderWidth: p.borderWidth,
          })),
        }
        return { ...base, layout }
      })
    },

    async split(image: WorkspaceImageInput, options: WorkspaceSplitOptions): Promise<WorkspaceSplitResult> {
      const splitImage =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).splitImage
          : (await import('@/tools/splitEngine')).splitImage

      return withLoadedImages([image], async ([loaded]) => {
        const stem = image.name.replace(/\.[^/.]+$/, '') || 'moklu-slice'
        const result = await splitImage(loaded, {
          mode: options.mode,
          count: options.carouselCount,
          carouselAspect: options.carouselAspect,
          rows: options.rows,
          cols: options.cols,
          format: options.format,
          quality: options.quality,
          filenamePrefix: stem,
          includeZip: true,
        })

        const slices = await Promise.all(
          result.slices.map(async (slice) => {
            const sliceFormat = resolveEncodedImageFormat(options.format, slice.blob)
            const sliceFilename =
              sliceFormat !== options.format
                ? `${sanitizeFilenameStem(slice.filename, 'slice')}.${extensionForFormat(sliceFormat)}`
                : slice.filename
            const base = await toBlobOutput(
              slice.blob,
              slice.width,
              slice.height,
              sliceFilename,
              sliceFormat,
            )
            return {
              ...base,
              index: slice.index,
              row: slice.row,
              col: slice.col,
            }
          }),
        )

        return { slices, zipBlob: result.zipBlob }
      })
    },

    async compress(
      images: WorkspaceImageInput[],
      options: WorkspaceCompressOptions,
    ): Promise<WorkspaceCompressItem[]> {
      const compressImages =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).compressImages
          : (await import('@/tools/compressEngine')).compressImages

      return withLoadedImages(images, async (loaded) => {
        const batch = await compressImages(loaded, {
          format: options.format,
          quality: options.quality,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          targetBytes: options.targetBytes,
          preserveOriginalDimensions: options.preserveOriginalDimensions,
          includeZip: false,
        })

        return Promise.all(
          batch.items.map(async (item, index) => {
            const source = images[index]
            const originalName = source?.name ?? item.originalName
            const originalBytes = source?.sizeBytes && source.sizeBytes > 0
              ? source.sizeBytes
              : item.originalBytes
            const actualFormat = resolveEncodedImageFormat(item.format, item.blob)
            const filename = formatSuffixedFilename(originalName, 'compressed', actualFormat)
            const base = await toBlobOutput(
              item.blob,
              item.width,
              item.height,
              filename,
              actualFormat,
            )
            const savedRatio = originalBytes > 0 ? (originalBytes - item.outputBytes) / originalBytes : 0
            return {
              ...base,
              id: source?.id ?? item.id,
              originalName,
              originalBytes,
              outputBytes: item.outputBytes,
              savedRatio,
              ...(source?.dataUrl !== undefined ? { originalDataUrl: source.dataUrl } : {}),
              originalWidth: item.originalWidth ?? source?.width ?? item.width,
              originalHeight: item.originalHeight ?? source?.height ?? item.height,
              ...(item.targetBytesMet !== undefined ? { targetBytesMet: item.targetBytesMet } : {}),
              ...(item.autoDownscaled !== undefined ? { autoDownscaled: item.autoDownscaled } : {}),
              ...(item.appliedQuality !== undefined ? { appliedQuality: item.appliedQuality } : {}),
              ...(source?.exif !== undefined ? { exif: source.exif } : {}),
            }
          }),
        )
      })
    },

    async transform(
      images: WorkspaceImageInput[],
      options: WorkspaceTransformOptions,
    ): Promise<WorkspaceBlobOutput[]> {
      const transformImages =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).transformImages
          : (await import('@/tools/transformEngine')).transformImages

      return withLoadedImages(images, async (loaded) => {
        const mappedAspect = mapAspectPreset(options.aspectRatio)
        const batch = await transformImages(loaded, {
          mode: options.mode,
          resize: options.mode === 'resize'
            ? {
                width: options.scale ? undefined : options.width,
                height: options.scale ? undefined : options.height,
                scale: options.scale,
                lockAspect: options.lockAspect,
              }
            : undefined,
          crop: options.mode === 'crop'
            ? {
                aspect: mappedAspect,
              }
            : undefined,
          pad: options.mode === 'pad'
            ? {
                aspect: mappedAspect ?? 'original',
                border: options.borderPx,
                background: parseBackgroundFill(options.background),
                borderRadius: options.borderRadius,
                shadow: options.shadow,
              }
            : undefined,
          format: options.format,
          quality: options.quality,
          includeZip: false,
        })

        return Promise.all(
          batch.items.map((item, index) => {
            const source = images[index]
            const actualFormat = resolveEncodedImageFormat(item.format, item.blob)
            const filename = source
              ? formatSuffixedFilename(source.name, options.mode, actualFormat)
              : item.filename
            return toBlobOutput(item.blob, item.width, item.height, filename, actualFormat)
          }),
        )
      })
    },

    async idCard(
      front: WorkspaceImageInput | null,
      back: WorkspaceImageInput | null,
      options: WorkspaceIdCardOptions,
    ): Promise<WorkspaceBlobOutput> {
      const composeIdCardSheet =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).composeIdCardSheet
          : (await import('@/tools/idCardEngine')).composeIdCardSheet

      const inputs: WorkspaceImageInput[] = []
      if (front) inputs.push(front)
      if (back) inputs.push(back)

      return withLoadedImages(inputs, async (loaded) => {
        const trimmedWatermark = options.watermarkText.trim()
        const result = await composeIdCardSheet(loaded, {
          dpi: options.dpi,
          grayscale: options.grayscale,
          watermark: trimmedWatermark
            ? {
                text: trimmedWatermark,
                opacity: options.watermarkOpacity,
                color: options.watermarkColor,
                fontSize: options.watermarkFontSize,
                angle: options.watermarkAngle,
                mode: options.watermarkMode,
              }
            : undefined,
          format: 'image/png',
          filename: `moklu-id-card-a4-${options.dpi}dpi.png`,
        })

        return toBlobOutput(result.blob, result.width, result.height, result.filename, result.format)
      })
    },

    async idPhotoMatte(
      image: WorkspaceImageInput,
      options?: WorkspaceIdPhotoMatteOptions,
    ): Promise<WorkspaceIdPhotoMatteHandle> {
      const extractPortraitMatte =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).extractPortraitMatte
          : (await import('@/tools/portraitMatting')).extractPortraitMatte

      return withLoadedImages([image], async ([loaded]) => {
        const matte = await extractPortraitMatte(loaded, { mode: options?.mode, onProgress: options?.onProgress })
        return { width: matte.width, height: matte.height, modeUsed: matte.modeUsed, framing: { ...matte.framing }, _payload: matte }
      })
    },

    async idPhotoRender(
      matte: WorkspaceIdPhotoMatteHandle,
      options: WorkspaceIdPhotoRenderOptions,
    ): Promise<WorkspaceIdPhotoRenderOutput> {
      const renderIdPhoto =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).renderIdPhoto
          : (await import('@/tools/idPhotoEngine')).renderIdPhoto

      const result = await renderIdPhoto({
        ...options,
        matte: matte._payload as PortraitMatteData,
        background: parseBackgroundFill(options.background),
      })
      const base = await toBlobOutput(result.blob, result.width, result.height, result.filename, result.format)
      const foregroundDataUrl = result.foregroundPngBlob ? await blobToDataUrl(result.foregroundPngBlob) : undefined
      return {
        ...base,
        ...(result.targetBytesMet !== undefined ? { targetBytesMet: result.targetBytesMet } : {}),
        ...(result.appliedQuality !== undefined ? { appliedQuality: result.appliedQuality } : {}),
        ...(foregroundDataUrl ? { foregroundDataUrl } : {}),
      }
    },

    async idPhotoTrioZip(
      matte: WorkspaceIdPhotoMatteHandle,
      options: Omit<WorkspaceIdPhotoRenderOptions, 'background'>,
      colors?: ReadonlyArray<{ name: string; hex: string }>,
    ): Promise<WorkspaceIdPhotoTrioResult> {
      const composeIdPhotoTrioZip =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).composeIdPhotoTrioZip
          : (await import('@/tools/idPhotoEngine')).composeIdPhotoTrioZip

      const result = await composeIdPhotoTrioZip({ ...options, matte: matte._payload as PortraitMatteData }, colors)
      const items = await Promise.all(
        result.items.map(async (item) => ({
          ...(await toBlobOutput(item.blob, item.width, item.height, item.filename, item.format)),
          ...(item.targetBytesMet !== undefined ? { targetBytesMet: item.targetBytesMet } : {}),
          ...(item.appliedQuality !== undefined ? { appliedQuality: item.appliedQuality } : {}),
        })),
      )
      return { zipBlob: result.zipBlob, items }
    },

    async idPhotoSheet(options: WorkspaceIdPhotoSheetOptions): Promise<WorkspaceIdPhotoSheetOutput> {
      const composeIdPhotoPrintSheet =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).composeIdPhotoPrintSheet
          : (await import('@/tools/idPhotoEngine')).composeIdPhotoPrintSheet

      const sheetInput: WorkspaceImageInput = {
        id: 'id-photo-sheet-source',
        name: `${options.filenameStem || 'id-photo'}.png`,
        width: options.photoWidthPx,
        height: options.photoHeightPx,
        dataUrl: options.photoDataUrl,
        sizeBytes: options.photoDataUrl.length,
        mimeType: 'image/png',
      }

      return withLoadedImages([sheetInput], async ([loaded]) => {
        const result = await composeIdPhotoPrintSheet({ ...options, photoDrawable: loaded.source, dpi: options.dpi ?? 300 })
        const base = await toBlobOutput(result.blob, result.width, result.height, result.filename, result.format)
        return { ...base, count: result.count, columns: result.columns, rows: result.rows }
      })
    },

    async packZip(files: Array<{ filename: string; blob: Blob }>): Promise<Blob> {
      const packBlobsToZip =
        import.meta.env.MODE === 'test'
          ? (await import('@/tools')).packBlobsToZip
          : (await import('@/tools/canvasHelpers')).packBlobsToZip
      return packBlobsToZip(files)
    },
  }
}
