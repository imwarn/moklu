/**
 * [INPUT]: depends on jszip (dynamic import), dataUrlToBlob from @/tools/canvasHelpers, and ProjectImageExportResult from ./multiFormatExport
 * [OUTPUT]: exports decodeDataUrlToBytes, buildExportZipBlob, writeExportDirectoryFile, and zipFileNameFor for offline CSP-safe Studio exports
 * [POS]: ZIP and File System Access directory export helpers within src/utils, consumed by ExportModal
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { dataUrlToBlob } from '@/tools/canvasHelpers'
import type { ProjectImageExportResult } from './multiFormatExport'

export interface ExportWritableFileStream {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

export interface ExportFileHandle {
  createWritable: () => Promise<ExportWritableFileStream>
}

export interface ExportDirectoryHandle {
  getDirectoryHandle?: (name: string, options?: { create?: boolean }) => Promise<ExportDirectoryHandle>
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<ExportFileHandle>
}

/**
 * Decode a `data:` URL into raw bytes completely offline without calling `fetch()`.
 * Production CSP headers omit `data:` from `connect-src`, so `fetch(dataUrl)` is blocked.
 */
export function decodeDataUrlToBytes(dataUrl: string): Uint8Array {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL: expected "data:" prefix.')
  }
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx < 0) {
    throw new Error('Invalid data URL: missing payload delimiter.')
  }
  const header = dataUrl.slice(0, commaIdx)
  const payload = dataUrl.slice(commaIdx + 1)

  if (/;base64$/i.test(header)) {
    const binary = atob(payload.replace(/\s+/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  return new TextEncoder().encode(decodeURIComponent(payload))
}

/**
 * Build a ZIP Blob from exported images using offline Uint8Array decoding
 * (supported consistently by JSZip in both browser and Node without calling fetch).
 */
export async function buildExportZipBlob(results: ProjectImageExportResult[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const item of results) {
    zip.file(`${item.relativePath}.png`, decodeDataUrlToBytes(item.dataUrl))
  }
  return zip.generateAsync({ type: 'blob' })
}

/**
 * Write a single exported PNG into a File System Access directory tree offline,
 * guaranteeing `writable.close()` runs in a `finally` block even if writing fails.
 */
export async function writeExportDirectoryFile(
  dirHandle: ExportDirectoryHandle,
  item: ProjectImageExportResult,
): Promise<void> {
  const blob = dataUrlToBlob(item.dataUrl)
  const parts = item.relativePath.split('/')
  const filename = `${parts.pop() ?? item.name}.png`
  let current = dirHandle
  for (const part of parts) {
    if (!current.getDirectoryHandle) break
    current = await current.getDirectoryHandle(part, { create: true })
  }
  const fileHandle = await current.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  try {
    await writable.write(blob)
  } finally {
    await writable.close()
  }
}

/** Sanitize a project name into a safe filename stem for the exported zip. */
export function zipFileNameFor(projectName: string): string {
  return `${projectName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase() || 'pixeldeck'}-export.zip`
}
