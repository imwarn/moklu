/**
 * [INPUT]: depends on vitest, jszip, and ./exportZip (buildExportZipBlob, decodeDataUrlToBytes, writeExportDirectoryFile, zipFileNameFor)
 * [OUTPUT]: Vitest unit tests verifying offline CSP-safe ZIP/directory export decoding and guaranteed writable stream cleanup
 * [POS]: automated unit test suite for src/utils/exportZip.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import JSZip from 'jszip'
import {
  buildExportZipBlob,
  decodeDataUrlToBytes,
  writeExportDirectoryFile,
  zipFileNameFor,
  type ExportDirectoryHandle,
} from './exportZip'
import type { ProjectImageExportResult } from './multiFormatExport'

const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function exportResult(overrides: Partial<ProjectImageExportResult>): ProjectImageExportResult {
  return {
    formatId: 'iphone-69' as ProjectImageExportResult['formatId'],
    formatLabel: 'iPhone 69',
    locale: 'en',
    groupId: 'group-1',
    groupName: 'Hero',
    name: 'hero',
    relativePath: 'iphone-69/en/hero',
    dataUrl: TINY_PNG,
    ...overrides,
  }
}

async function fileEntries(blob: Blob): Promise<string[]> {
  const loaded = await JSZip.loadAsync(await blob.arrayBuffer())
  return Object.keys(loaded.files).filter((key) => !loaded.files[key].dir)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('decodeDataUrlToBytes', () => {
  it('decodes base64 PNG data URLs offline without calling fetch', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('CSP blocked fetch(data:)')
    })

    const bytes = decodeDataUrlToBytes(TINY_PNG)
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_MAGIC)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('decodes URL-encoded non-base64 data URLs', () => {
    const bytes = decodeDataUrlToBytes('data:text/plain,hello%20moklu')
    expect(new TextDecoder().decode(bytes)).toBe('hello moklu')
  })

  it('throws on malformed data URLs', () => {
    expect(() => decodeDataUrlToBytes('https://example.com/image.png')).toThrow(/Invalid data URL/)
    expect(() => decodeDataUrlToBytes('data:image/png;base64')).toThrow(/Invalid data URL/)
  })
})

describe('buildExportZipBlob', () => {
  it('produces a zip with valid PNG entries even when fetch is blocked by CSP', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('CSP blocked fetch(data:)')
    })

    const blob = await buildExportZipBlob([
      exportResult({ relativePath: 'iphone-69/en/hero', name: 'hero' }),
      exportResult({ relativePath: 'iphone-69/en/screen2', name: 'screen2' }),
    ])

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(await fileEntries(blob)).toEqual([
      'iphone-69/en/hero.png',
      'iphone-69/en/screen2.png',
    ])

    const loaded = await JSZip.loadAsync(await blob.arrayBuffer())
    const heroBytes = await loaded.file('iphone-69/en/hero.png')!.async('uint8array')
    expect(Array.from(heroBytes.slice(0, 8))).toEqual(PNG_MAGIC)
  })

  it('produces an empty valid zip archive for empty results', async () => {
    const blob = await buildExportZipBlob([])

    expect(blob.size).toBeGreaterThan(0)
    expect(await fileEntries(blob)).toEqual([])
  })
})

describe('writeExportDirectoryFile', () => {
  it('writes decoded PNG blobs into nested folders offline without fetch and closes writable', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('CSP blocked fetch(data:)')
    })

    const createdDirs: string[] = []
    const writtenFiles = new Map<string, Blob>()
    const closeSpy = vi.fn(async () => {})

    const makeDir = (prefix = ''): ExportDirectoryHandle => ({
      async getDirectoryHandle(name) {
        const next = prefix ? `${prefix}/${name}` : name
        createdDirs.push(next)
        return makeDir(next)
      },
      async getFileHandle(name) {
        const full = prefix ? `${prefix}/${name}` : name
        return {
          async createWritable() {
            return {
              async write(data) {
                writtenFiles.set(full, data as Blob)
              },
              close: closeSpy,
            }
          },
        }
      },
    })

    await writeExportDirectoryFile(makeDir(), exportResult({ relativePath: 'iphone-69/en/hero' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(createdDirs).toEqual(['iphone-69', 'iphone-69/en'])
    expect(closeSpy).toHaveBeenCalledTimes(1)

    const written = writtenFiles.get('iphone-69/en/hero.png')
    expect(written).toBeInstanceOf(Blob)
    expect(written?.type).toBe('image/png')
    const bytes = new Uint8Array(await written!.arrayBuffer())
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_MAGIC)
  })

  it('still closes writable in finally when write throws', async () => {
    const closeSpy = vi.fn(async () => {})
    const root: ExportDirectoryHandle = {
      async getDirectoryHandle() {
        return root
      },
      async getFileHandle() {
        return {
          async createWritable() {
            return {
              async write() {
                throw new Error('Disk full')
              },
              close: closeSpy,
            }
          },
        }
      },
    }

    await expect(writeExportDirectoryFile(root, exportResult({ relativePath: 'hero' }))).rejects.toThrow('Disk full')
    expect(closeSpy).toHaveBeenCalledTimes(1)
  })
})

describe('zipFileNameFor', () => {
  it('sanitizes project names into lowercase zip filenames', () => {
    expect(zipFileNameFor('My Cool App')).toBe('my-cool-app-export.zip')
  })

  it('falls back for an empty project name', () => {
    expect(zipFileNameFor('')).toBe('pixeldeck-export.zip')
  })

  it('preserves the existing dash replacement behavior for punctuation', () => {
    expect(zipFileNameFor('!!!')).toBe('----export.zip')
  })
})
