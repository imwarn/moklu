/**
 * [INPUT]: depends on src/tools barrel (loadImageItem, disposeImageItems, mergeImages, splitImage, compressImages, transformImages, composeIdCardSheet, packBlobsToZip, sanitizeFilenameStem, extensionForFormat) and src/workspace/types (WorkspaceEngines and option/output contracts)
 * [OUTPUT]: exports parseBackgroundFill, formatSuffixedFilename, and createToolsWorkspaceEngines adapting src/tools pure canvas engines to the WorkspaceEngines DIP contract with guaranteed LoadedImageItem disposal
 * [POS]: concrete integration adapter inside src/workspace; bridges UI panels in src/workspace/tools to the tested pure-canvas engines in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import {
  composeIdCardSheet,
  compressImages,
  disposeImageItems,
  extensionForFormat,
  loadImageItem,
  mergeImages,
  packBlobsToZip,
  sanitizeFilenameStem,
  splitImage,
  transformImages,
  type AspectPreset,
  type BackgroundFill,
  type GradientStop,
  type LoadedImageItem,
} from '@/tools'
import type {
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceCompressItem,
  WorkspaceCompressOptions,
  WorkspaceEngines,
  WorkspaceIdCardOptions,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceMergeLayout,
  WorkspaceMergeOptions,
  WorkspaceMergeOutput,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceTransformOptions,
} from './types'

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

async function withLoadedImages<T>(
  inputs: readonly WorkspaceImageInput[],
  fn: (loaded: LoadedImageItem[]) => Promise<T>,
): Promise<T> {
  const loaded: LoadedImageItem[] = []
  try {
    for (const input of inputs) {
      const item = await loadImageItem(input.file ?? input.dataUrl, { name: input.name })
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
          filename: `moklu-merged.${ext}`,
        })
        const base = await toBlobOutput(result.blob, result.width, result.height, result.filename, result.format, {
          previewBlob: result.previewBlob,
          scaleFactor: result.layout.scaleFactor,
        })
        const layout: WorkspaceMergeLayout = {
          width: result.layout.width,
          height: result.layout.height,
          scaleFactor: result.layout.scaleFactor,
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
            const base = await toBlobOutput(
              slice.blob,
              slice.width,
              slice.height,
              slice.filename,
              options.format,
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
      return withLoadedImages(images, async (loaded) => {
        const batch = await compressImages(loaded, {
          format: options.format,
          quality: options.quality,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          includeZip: false,
        })

        return Promise.all(
          batch.items.map(async (item, index) => {
            const source = images[index]
            const originalName = source?.name ?? item.originalName
            const originalBytes = source?.sizeBytes && source.sizeBytes > 0
              ? source.sizeBytes
              : item.originalBytes
            const filename = formatSuffixedFilename(originalName, 'compressed', options.format)
            const base = await toBlobOutput(
              item.blob,
              item.width,
              item.height,
              filename,
              item.format,
            )
            const savedRatio = originalBytes > 0 ? (originalBytes - item.outputBytes) / originalBytes : 0
            return {
              ...base,
              id: source?.id ?? item.id,
              originalName,
              originalBytes,
              outputBytes: item.outputBytes,
              savedRatio,
            }
          }),
        )
      })
    },

    async transform(
      images: WorkspaceImageInput[],
      options: WorkspaceTransformOptions,
    ): Promise<WorkspaceBlobOutput[]> {
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
            const filename = source
              ? formatSuffixedFilename(source.name, options.mode, options.format)
              : item.filename
            return toBlobOutput(item.blob, item.width, item.height, filename, item.format)
          }),
        )
      })
    },

    async idCard(
      front: WorkspaceImageInput | null,
      back: WorkspaceImageInput | null,
      options: WorkspaceIdCardOptions,
    ): Promise<WorkspaceBlobOutput> {
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

    async packZip(files: Array<{ filename: string; blob: Blob }>): Promise<Blob> {
      return packBlobsToZip(files)
    },
  }
}
